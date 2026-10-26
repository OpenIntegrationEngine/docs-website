---
title: Script Scope and User API
description: What each script has in scope, the maps, and the User API classes
---

# Script Scope and User API

OIE uses the **Mozilla Rhino** JavaScript engine (1.7.13) for all scripting. The language version is set by `rhino.languageversion` in `mirth.properties`; the shipped file sets `es6`. JavaScript is used in transformers, filters, channel scripts, and connector scripts. On this Rhino build a template literal is not interpolated (the placeholder text is emitted as written) and a `const` declared inside a loop body keeps its first value on every later iteration, so the samples on this page use `var` and string concatenation.

## Script contexts

| Context | When It Executes | Available Objects |
|---|---|---|
| **Preprocessor** | Before source transformer | `message` (raw string), `connectorMessage`, `connector`, `sourceMap`, `connectorMap`, `channelMap`, `responseMap`, `destinationSet`, `globalMap`, `globalChannelMap`, `configurationMap` |
| **Source Filter** | During source processing | `msg`, `connectorMessage`, `connector`, `sourceMap`, `connectorMap`, `channelMap`, `responseMap`, `destinationSet`, `globalMap`, `globalChannelMap`, `configurationMap`, and `tmp` when the source transformer has an outbound template |
| **Source Transformer** | During source processing | `msg`, `tmp`, `connectorMessage`, `connector`, `sourceMap`, `connectorMap`, `channelMap`, `responseMap`, `destinationSet`, `globalMap`, `globalChannelMap`, `configurationMap` |
| **Destination Filter** | Per destination | `msg`, `connectorMessage`, `connector`, `sourceMap`, `connectorMap`, `channelMap`, `responseMap`, `globalMap`, `globalChannelMap`, `configurationMap`, and `tmp` when the destination's transformer has an outbound template |
| **Destination Transformer** | Per destination | `msg`, `tmp`, `connectorMessage`, `connector`, `sourceMap`, `connectorMap`, `channelMap`, `responseMap`, `globalMap`, `globalChannelMap`, `configurationMap` |
| **Response Transformer** | After destination send | `msg`, `response`, `responseStatus`, `responseErrorMessage`, `responseStatusMessage`, `connectorMessage`, `connector`, `sourceMap`, `connectorMap`, `channelMap`, `responseMap`, `globalMap`, `globalChannelMap`, `configurationMap` |
| **Postprocessor** | After all destinations | `message` (Message object), `sourceMap`, `channelMap`, `responseMap`, `response` (global postprocessor only), `globalMap`, `globalChannelMap`, `configurationMap` |
| **Deploy Script** | On channel deploy | `globalMap`, `globalChannelMap`, `configurationMap` |
| **Undeploy Script** | On channel undeploy | `globalMap`, `globalChannelMap`, `configurationMap` |
| **Attachment Script** | During source processing | `message` (raw string), `sourceMap`, `globalMap`, `globalChannelMap`, `configurationMap` |
| **Batch Script** | During source processing | `reader`, `sourceMap`, `globalMap`, `globalChannelMap`, `configurationMap`. The Delimited Text data type adds `columnDelimiter`, `recordDelimiter`, `columnWidths`, `quoteToken`, `escapeWithDoubleQuote`, `quoteEscapeToken`, `ignoreCR`, and `skipRecords` |
| **JavaScript Reader** | Each poll of the source connector | `globalMap`, `globalChannelMap`, `configurationMap`. No `connectorMessage` and no message maps, because no message exists yet |
| **Database Reader, JavaScript mode, select script** | Each poll of the source connector | `globalMap`, `globalChannelMap`, `configurationMap`. No `connectorMessage` and no message maps |
| **Database Reader, JavaScript mode, post-process script** | After the message is processed (**Run Post-Process Script**) | `globalMap`, `globalChannelMap`, `configurationMap`; `resultMap` (one row) after each message, or `results` (every row) when Aggregate Results is Yes and the script runs once after all messages. When the engine has the processed message the script also has `connectorMessage`, `connector`, `sourceMap`, `connectorMap`, `channelMap`, `responseMap`, `destinationSet` |
| **JavaScript Writer** and **Database Writer, JavaScript mode** | Per destination | `connectorMessage`, `connector`, `sourceMap`, `connectorMap`, `channelMap`, `responseMap`, `globalMap`, `globalChannelMap`, `configurationMap` |

Every context also has `logger`, `router` (a `VMRouter`), `replacer`, `DatabaseConnectionFactory`, `contextFactory`, and the map shorthand functions described under Maps. Channel scripts also have `channelId`, `channelName`, `globalChannelMap`, and `alerts`. The global deploy and undeploy scripts (see [Global scripts](./global_scripts.md)) have none of those four. The postprocessor, response transformer, JavaScript Writer, and Database Writer scripts also have the status constants `RECEIVED`, `FILTERED`, `TRANSFORMED`, `SENT`, `QUEUED`, `ERROR`, and `PENDING`.

## Core objects

### Message (`msg`)
The message as the script sees it, available in filters and transformers. Its type follows the inbound data type: for XML-based types (HL7 v2 included) it is an E4X `XML` object, for JSON a JavaScript object, and for Raw a string. The E4X object is the document element itself, so its children are addressed directly. The engine serializes HL7 v2 into XML with an `HL7Message` document element whose children are segments (`PID`), fields (`PID.5`), and components (`PID.5.1`); bracket paths of that form work only under the HL7 v2 data type. `for each` is the E4X loop over an `XMLList`.

```javascript
// Source or destination filter/transformer, HL7 v2 data type: segment, field, component
var lastName = msg['PID']['PID.5']['PID.5.1'].toString();
var messageType = msg['MSH']['MSH.9']['MSH.9.1'].toString();

// Set a field value
msg['PID']['PID.5']['PID.5.1'] = 'NEWNAME';

// Iterate repeating segments (E4X for each over the OBX XMLList)
var results = [];
for each (var obx in msg['OBX']) {
    results.push(obx['OBX.5']['OBX.5.1'].toString());
}
```

Under the XML data type `msg` is the document element, so for `<order><id>42</id></order>` the child is read directly:

```javascript
// XML data type: no wrapper element to step through
var orderId = msg['id'].toString();
```

### Template (`tmp`)
The outbound message template. It exists only when the transformer has an outbound template, and when it does the transformer's output is taken from `tmp` rather than `msg`. Its type follows the outbound data type the same way `msg` follows the inbound one: E4X XML for XML-based types, a JavaScript object for JSON, a string for Raw. Modify it to change what is sent to the destination.

```javascript
// Source or destination transformer with an HL7 v2 outbound template
tmp['MSH']['MSH.3']['MSH.3.1'] = 'NEW_SENDING_APP';
tmp['MSH']['MSH.5']['MSH.5.1'] = 'NEW_RECEIVING_APP';
```

### Connector message (`connectorMessage`)
The `ImmutableConnectorMessage` Java object for the message being processed, with access to all content types, metadata, and status. It is in scope in the preprocessor, filters, transformers, the response transformer, and the JavaScript Writer and Database Writer (JavaScript mode) scripts; the postprocessor has `message` (an `ImmutableMessage`) instead.

```javascript
// channelId is already a scope variable; the source connector's metadata id is 0
var rawContent = connectorMessage.getRawData();
var messageId = connectorMessage.getMessageId();
var metaDataId = connectorMessage.getMetaDataId();
```

## Maps

Maps hold values that scripts share. The table gives how long each one lasts.

| Map | Scope | Access |
|---|---|---|
| `sourceMap` | Current message, source metadata | Read-only in every context |
| `connectorMap` | Current message, current connector | Read/write in current connector scripts |
| `channelMap` | Current message, all connectors | Read/write while a message is processed; read-only in the postprocessor |
| `responseMap` | Current message, response data | Read/write; stores destination responses |
| `globalChannelMap` | All messages in this channel | Persists across messages |
| `globalMap` | All channels on the server | Persists across channels |
| `configurationMap` | Server-wide configuration | Read-only; set in server settings |

Every script scope also defines a shorthand function per map: `$co` (connectorMap), `$c` (channelMap), `$s` (sourceMap), `$gc` (globalChannelMap), `$g` (globalMap), `$cfg` (configurationMap), and `$r` (responseMap). One argument reads a key, two arguments write it. `$(key)` reads only: it searches the response, connector, channel, source, global channel, global, and configuration maps in that order and returns `''` when no map holds the key. A shorthand for a map that is not in the current scope throws a `ReferenceError`, for example `$co` in a deploy script.

In the postprocessor the channel map comes from an `ImmutableConnectorMessage` built without modifiable maps, so `channelMap.put` and `$c(key, value)` throw `UnsupportedOperationException` there. The postprocessor reads the maps and may return a `Response`; a per-message fact that must be recorded is written to the channel map from a transformer or a destination script.

### Usage
```javascript
// Source transformer, HL7 v2 inbound. A per-message fact goes in the channel map,
// which the Message Browser shows on the message. $c is channelMap.get/put.
$c('patientId', msg['PID']['PID.3']['PID.3.1'].toString());
var patientId = $c('patientId');
channelMap.put('messageType', msg['MSH']['MSH.9']['MSH.9.1'].toString());

// A channel map key is ${patientId} in Velocity template fields such as a File Writer path

// A value that outlives the message and belongs to this channel: globalChannelMap
$gc('lastProcessedTime', new Date().toString());
var lastTime = $gc('lastProcessedTime');

// globalMap is shared by every channel on the server; read a value the deploy script stored
var siteCode = $g('siteCode');

// Configuration map, set in Settings
var apiKey = $cfg('externalApiKey');

// $(key) searches the maps in order and returns '' when no map has the key
var lookup = $('patientId');
```

## Utility classes

These Java classes are available in all script contexts; `com.mirth.connect.userutil` and `com.mirth.connect.server.userutil` are imported into every scope. `DatabaseConnectionFactory` is an instance the engine places in scope rather than a static class.

### ChannelUtil
```javascript
// channelId and channelName are scope variables in every channel script
var name = ChannelUtil.getDeployedChannelName(channelId);
var id = ChannelUtil.getDeployedChannelId(channelName);

// Channel state, returned as a DeployedState
var state = ChannelUtil.getChannelState(channelId);

// One connector's state; the source connector has metadata id 0
var sourceState = ChannelUtil.getConnectorState(channelId, 0);
```

### DateUtil
```javascript
// Parse a date string; throws only when the start of the input cannot be parsed, and ignores trailing text
var date = DateUtil.getDate('yyyyMMddHHmmss', '20240101120000');

// Format a java.util.Date
var formatted = DateUtil.formatDate('yyyy-MM-dd', date);

// Convert between formats in one call
var result = DateUtil.convertDate('yyyyMMddHHmmss', 'yyyy-MM-dd', '20240101120000');
```

### FileUtil
```javascript
// Read file contents
var content = FileUtil.read('/path/to/file.txt');

// Write file
FileUtil.write('/path/to/output.txt', false, content); // false = don't append
```

### DatabaseConnectionFactory
`createDatabaseConnection` opens a plain JDBC connection, not a pooled one, and the engine never closes it, so close it in `finally`. `executeCachedQuery` returns a JDBC `CachedRowSet`; a JavaScript array is accepted for the parameter list. It works in any script context. The sample runs in a transformer and reads `patientId` from the channel map and the credentials from the configuration map, which is set in server settings.

```javascript
var patientId = $c('patientId');
var conn = DatabaseConnectionFactory.createDatabaseConnection('org.postgresql.Driver', 'jdbc:postgresql://dbhost:5432/clinical', $cfg('clinicalDbUser'), $cfg('clinicalDbPassword'));
var names = [];
try {
    var result = conn.executeCachedQuery('SELECT name FROM patients WHERE id = ?', [patientId]);
    while (result.next()) {
        names.push(result.getString('name'));
    }
} finally {
    conn.close();
}
```

### HTTPUtil
```javascript
// Parse a block of HTTP header lines into a java.util.Map of name to value
var headerString = 'Content-Type: text/plain\r\nX-Request-Id: 42\r\n';
var headers = HTTPUtil.parseHeaders(headerString);
var requestId = headers.get('X-Request-Id');
```

### SMTPConnectionFactory
`createSMTPConnection()` takes the host, port, credentials, and default from address from the server's SMTP settings.

```javascript
// Send email from scripts
var smtp = SMTPConnectionFactory.createSMTPConnection();
smtp.send('to@example.com', 'cc@example.com', 'from@example.com', 'Subject', 'Body');
```

### VMRouter
```javascript
// router is a VMRouter instance the engine places in every script context.
// routeMessage returns the Response the target channel's source connector selected,
// null when it selects none (the default), and a Response with status ERROR when
// the dispatch itself fails. Here a transformer records the status on the message.
var routeResult = router.routeMessage('targetChannelName', 'message content');
if (routeResult != null) {
    $c('routeStatus', routeResult.getStatus().toString());
}
router.routeMessageByChannelId('channel-uuid', 'message content');
```

### AttachmentUtil
```javascript
// Any context that has connectorMessage (see Connector message above)
var attachments = AttachmentUtil.getMessageAttachments(connectorMessage);
```

### SerializerFactory
```javascript
// Create a serializer for a data type by its plugin name
var serializer = SerializerFactory.getSerializer('HL7V2');
var xml = serializer.toXML('MSH|^~\\&|SENDAPP|SENDFAC|RECVAPP|RECVFAC|20260904091500||ADT^A01|MSG00001|P|2.5.1');
var hl7 = serializer.fromXML(xml);
```

### ResponseFactory
A `Response` is what the postprocessor and a JavaScript Writer return to set the message's response.

```javascript
// Create custom responses
var response = ResponseFactory.getSentResponse('Custom ACK message');
var errorResponse = ResponseFactory.getErrorResponse('Processing failed');
```

### DICOMUtil
```javascript
// Any context that has connectorMessage; the channel's data type is DICOM.
// Merged DICOM data (header plus attachments) as a Base64 string
var rawData = DICOMUtil.getDICOMRawData(connectorMessage);

// The same merged data as a byte array; getDICOMMessage returns the same byte array
var rawBytes = DICOMUtil.getDICOMRawBytes(connectorMessage);
var dicomMessage = DICOMUtil.getDICOMMessage(connectorMessage);
```

### HashUtil
```javascript
var data = 'text to hash';

// SHA-256 hex digest (default algorithm)
var hash = HashUtil.generate(data);

// Hex digest with an explicit character encoding and algorithm
var md5 = HashUtil.generate(data, 'UTF-8', 'MD5');
```

### EncryptionUtil
Both calls use the server's own configured encryptor, so a value encrypted here is decrypted only by a server with the same key.

```javascript
var data = 'text to protect';

// Encrypt/decrypt data
var encrypted = EncryptionUtil.encrypt(data);
var decrypted = EncryptionUtil.decrypt(encrypted);
```

## Logging

`logger` is in every script context. It is a Log4j logger named for the script type (list below), and the shipped `log4j2.properties` sets every script logger to DEBUG, so anything a script logs is written to `mirth.log`. Log at deploy or undeploy time and in `catch` blocks; a per-message fact belongs in the channel map, which the Message Browser shows on the message. Prefix `channelName` wherever it is in scope: channel scripts have it and the global deploy and undeploy scripts do not.

```javascript
// Channel deploy script. channelName is in scope here.
logger.info(channelName + ': deploy started');

try {
    var lookup = FileUtil.read('/path/to/lookup.csv');
    $gc('lookup', lookup);
} catch (e) {
    // A failed Java call arrives as a JavaScript error wrapping the Throwable in e.javaException.
    // Passing e itself binds error(String, Object) and logs no stack trace.
    logger.error(channelName + ': deploy failed', e.javaException || e);
    throw e;
}
```

When the deploy script throws, the engine logs the error itself with its stack trace, records a server event, and the deploy fails. The rethrow is what fails the deploy; without it the deploy continues with nothing stored under `lookup`.

Each script type logs under its own logger name, configured in `log4j2.properties`:
- `filter`: Filter script logs
- `transformer`: Transformer script logs
- `response`: Response transformer logs
- `preprocessor`: Preprocessor logs
- `postprocessor`: Postprocessor logs
- `deploy` / `undeploy`: Deploy/undeploy script logs
- `attachment`: Attachment script logs
- `batch`: Batch script logs
- `db-connector` / `js-connector`: Database and JavaScript connector logs

## Destination set

`destinationSet` exists in the preprocessor and in the source filter and transformer, where it controls which destinations receive the current message. A destination is addressed by its connector name or its metadata id (destinations start at 1). Each call returns `true` when at least one destination was removed.

```javascript
// Source transformer
var removed = destinationSet.remove('Backup Writer');

// Remove every destination except one
destinationSet.removeAllExcept('Primary Sender');

// A JavaScript array removes several at once, by name or metadata id
destinationSet.remove(['Backup Writer', 3]);

// Remove all destinations; the source message is not marked FILTERED
destinationSet.removeAll();
```

## Java interop

Since Rhino runs on the JVM, you can access Java classes directly. `importPackage` is not local to the script that calls it: name lookup in every script falls through to a sealed scope shared by all channels with the same library resources (channels with none share one for the life of the server), and `importPackage` adds the package to that shared scope. Scripts in other channels then resolve the bare class names without importing, and a second package holding a class of the same name makes that name an `Ambiguous import` error in scripts that imported neither. Alias the class with `var` or use its fully qualified name.

```javascript
// Alias a Java class (the userutil packages are already imported)
var ArrayList = java.util.ArrayList;
var list = new ArrayList();
list.add('item1');

// Use a fully qualified name
var File = java.io.File;
var file = new File('/path/to/file');
var uuid = java.util.UUID.randomUUID().toString();

// Static methods; encodeToString needs a byte[], not a JavaScript string
var bytes = new java.lang.String('hello').getBytes('UTF-8');
var base64 = java.util.Base64.getEncoder().encodeToString(bytes);
```
