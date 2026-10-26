---
title: Channel Development Guide
description: Building channels end-to-end
---

# Channel Development Guide

## Planning a channel

Before building, identify:

1. **Source system**: Where messages come from
2. **Message format**: HL7 v2.x, XML, JSON, etc.
3. **Protocol**: TCP/[MLLP](./glossary.md#mllp), HTTP, file, database, etc.
4. **Transformation requirements**: What needs to change
5. **Destination system(s)**: Where messages go
6. **Error handling**: What happens when delivery fails
7. **Volume**: Expected message throughput

## Creating a channel

1. In the Channels view, click **New Channel** in the Channel Tasks pane
2. Enter a channel name and optional description on the **Summary** tab
3. Configure the **Source** tab (connector type and settings)
4. Configure the **Destinations** tab (one or more destination connectors)
5. Optionally configure **Scripts** (deploy, undeploy, preprocessor, postprocessor)
6. Save with `Ctrl+S` (`Cmd+S` on macOS)

## Setting data types

1. In the **Summary** tab, click **Set Data Types**
2. For each connector, set:
   - **Inbound** data type (how the engine serializes the received message). On a destination connector it is not set by hand; it follows the source connector's Outbound type.
   - **Outbound** data type (how the engine deserializes the message for output)

## The msg and tmp objects

When a message enters a filter or transformer, the engine hands it to the script as a JavaScript variable called **msg**, serialized first unless the data type is Raw. Depending on the data type, `msg` may be an E4X XML object (for XML-based data types like HL7 v2.x), a JavaScript object (for JSON), or a JavaScript String object (for raw data types). Under the HL7 v2.x data type the element names follow segment, field, and component: `msg['PID']['PID.5']['PID.5.1']` is the first component of PID-5, and a field with no components still gets a `.1` child, apart from MSH.1 and MSH.2, which hold the field separator and the encoding characters directly with no component child. Neither an E4X node nor the raw String object is a string primitive, so `msg['PID']['PID.8']['PID.8.1'] === 'M'` is false even when the field is `M`; call `.toString()` on the node, or on the raw `msg`, before comparing it with `===` or storing it in a map. Every sample on this page assumes the HL7 v2.x data type.

The **tmp** variable is similar to `msg`, except it represents the outbound template rather than the inbound message. It is only available in the transformer when an outbound template is configured. Use `tmp` when you want to convert a message from one format to another (e.g. HL7 v2.x to JSON) or selectively include pieces of the inbound message in the outbound message.

## Building transformers

A transformer is made up of **steps**, and each step runs as JavaScript. A step usually modifies the message or pulls a value out of it. Transformers have an **inbound data type** and an **outbound data type**, which the engine uses to serialize the message on the way in and deserialize it on the way out.

### Step types

| Type | What it does |
|---|---|
| **Mapper** | Extract a value from the message and store it in a variable map |
| **Message Builder** | Map a value into a field of `msg` or `tmp` |
| **JavaScript** | Runs a script you write |
| **External Script** | Reference an external JavaScript file on the server |
| **XSLT** | Apply an XSLT stylesheet to an XML document |
| **Destination Set Filter** | Control which destinations receive the message (source transformer only) |
| **Iterator** | Loop over repeating segments or array elements |

### Mapper step

Extracts data from a field in the message (or an expression) and places it into a variable map.

| Field | Description |
|---|---|
| **Variable** | The variable name / key to store the value under |
| **Add to** | Which map to place the variable in (Channel Map, Connector Map, Response Map, etc.) |
| **Mapping** | The value to extract: a message field or any JavaScript expression |
| **Default Value** | Fallback value if the Mapping is not found or evaluates to empty. It is a JavaScript expression, so literal text needs quotes, for example `'N/A'`; an unquoted word is read as a variable name and the step errors |
| **String Replacement** | Optional regex-based find/replace applied to the value before it is stored. Both fields are JavaScript expressions, so quote them: `'[0-9]+'` and `'N'`. An unquoted regular expression is a syntax error, and the channel does not deploy |

The Mapping field is a JavaScript expression evaluated inside the transformer step, with `msg` in scope. Example mapping expression, the first component of PID-5:
```javascript
msg['PID']['PID.5']['PID.5.1'].toString()
```

Once stored, read the variable in JavaScript with the map's `.get()` method or the matching shorthand function. For example, if you add to Channel Map under the variable name `patientName`: `channelMap.get('patientName')` or `$c('patientName')`. The shorthands `$co`, `$c`, `$s`, `$gc`, `$g`, `$cfg`, and `$r` read the connector, channel, source, global channel, global, configuration, and response maps with one argument. With two arguments they write the map, except `$s` and `$cfg`: the source map and the configuration map are read-only, and writing to them throws an error.

### Message Builder step

Maps a value from the message (or an expression) into a field of `msg` or `tmp`. Use it to modify a field in place, copy a field from one location to another, or map data from the inbound message into the outbound template.

| Field | Description |
|---|---|
| **Message Segment** | The target field in `msg` or `tmp` (drag from the message tree) |
| **Mapping** | The value to assign: a message field or any JavaScript expression |
| **Default Value** | Fallback value if the Mapping is not found or evaluates to empty. It is a JavaScript expression, so literal text needs quotes, for example `'N/A'`; an unquoted word is read as a variable name and the step errors |
| **String Replacement** | Optional regex-based find/replace applied to the value before it is inserted. Both fields are JavaScript expressions, so quote them: `'[0-9]+'` and `'N'`. An unquoted regular expression is a syntax error, and the channel does not deploy |

Example, copying a field from the inbound message to the outbound template. The step assigns to `tmp`, so the transformer needs an outbound template for `tmp` to exist:
- **Message Segment:** `tmp['PV1']['PV1.9']['PV1.9.1']`
- **Mapping:** `msg['OBR']['OBR.16']['OBR.16.1'].toString()`

### JavaScript step

The step runs inside the transformer with the same `msg` and `tmp` as the other steps. The sample below reads from the inbound message and writes into the outbound template, so the transformer needs an outbound template; without one `tmp` is never defined and the first assignment throws a ReferenceError. Both are E4X XML objects under the HL7 v2.x data type.

```javascript
// Read a field from the inbound message, write the mapped value into the outbound template
var gender = msg['PID']['PID.8']['PID.8.1'].toString();
if (gender === 'M') {
    tmp['PID']['PID.8']['PID.8.1'] = 'Male';
} else if (gender === 'F') {
    tmp['PID']['PID.8']['PID.8.1'] = 'Female';
} else {
    tmp['PID']['PID.8']['PID.8.1'] = 'Unknown';
}
```

### Destination Set Filter step

A source transformer step that removes destinations from the current message's destination set, so they do not process it. It does not mark the source message as filtered.

| Field | Description |
|---|---|
| **Behavior** | Whether to filter "the following", "all except the following", or "all" destinations |
| **Destinations** | The destinations to include or exclude based on the behavior |
| **Field** | The message field or expression to test |
| **Condition** | Exists, Not Exist, Equals, Not Equal, Contains, or Not Contain |
| **Values** | One or more values to test the field against. Each is a JavaScript expression, so literal text needs quotes: `"ADT"`. Values are compared as text, not as regular expressions: Equals needs an exact match and Contains a substring |

### Iterator step

Loops over repeating segments or array elements, executing child steps for each iteration.

| Field | Description |
|---|---|
| **Iterate On** | The element to iterate over: a list of E4X XML nodes or a Java/JavaScript array (e.g. `msg['PID']`) |
| **Index Variable** | The loop variable name (default `i`) used to index into the element |
| **Drag-and-Drop Substitutions** | Prefixes that will have the index variable injected when dragging fields into child steps |

When you drag a field from the message tree into a child step, the index variable is automatically inserted. For example, if **Iterate On** is `msg['PID']` and the index variable is `i`, then dragging `msg['PID']['PID.3']['PID.3.1'].toString()` into a child step produces `msg['PID'][i]['PID.3']['PID.3.1'].toString()`.

You can create iterators automatically by dragging a repeating node from the inbound message tree onto a node in the outbound tree. OIE will prompt you to set up an iterator with the correct substitutions.

## Building filters

The filter decides whether a message should proceed to the next step. It returns **true** (accept) or **false** (filter). A filter is made up of multiple **rules**, each joined by an **AND** or **OR** operator.

- If the **source** filter filters a message, it will not flow through the source transformer or to any destination.
- If a **destination** filter filters a message, it will not flow through that destination's transformer or be dispatched outbound, but other destinations may still process the message.

### Filter rule types

| Rule Type | What it does |
|---|---|
| **Rule Builder** | GUI-based conditions against a message field |
| **JavaScript** | Custom filtering logic (return `true` to accept, `false` to filter) |
| **External Script** | Reference an external JavaScript file on the server |
| **Iterator** | Loop over repeating elements to decide whether to accept or filter |

### Rule Builder

| Field | Description |
|---|---|
| **Behavior** | Always set to **Accept**. If the expression evaluates to true, the message is accepted |
| **Field** | The message field or expression to test (drag from the message tree) |
| **Condition** | **Exists**, **Not Exist**, **Equals**, **Not Equal**, **Contains**, or **Not Contain** |
| **Values** | One or more values to test the field against. Each is a JavaScript expression, so literal text needs quotes: `"ADT"`. Values are compared as text, not as regular expressions: Equals needs an exact match and Contains a substring |

When the Values table has multiple entries, conditions like Equals and Contains return true if the field matches **any** of the values. Not Equal and Not Contain return true if the field matches **none** of the values.

### JavaScript filter

The engine wraps a JavaScript rule's script in its own function, so the script ends with `return` and a boolean: `true` accepts the message, `false` filters it. `msg` is the parsed inbound message, an E4X XML object under the HL7 v2.x data type.

```javascript
// Accept only ADT^A01 messages
var messageType = msg['MSH']['MSH.9']['MSH.9.1'].toString();
var triggerEvent = msg['MSH']['MSH.9']['MSH.9.2'].toString();
return (messageType === 'ADT' && triggerEvent === 'A01');
```

### Combining rules
- Each rule is joined by an **AND** or **OR** operator (click the operator icon next to the rule name to toggle)
- Standard logical precedence applies: **AND** is evaluated before **OR**

## Channel scripts

Four scripts can be configured on the **Scripts** tab of the Edit Channel view. Each runs inside a scope the engine builds for it. The objects the samples below use come from that scope:

| Object | In scope for | What it is |
|---|---|---|
| `channelId`, `channelName` | All four | The channel's id and name. |
| `globalChannelMap` | All four | A map private to this channel, shared by every script and thread of the channel and kept across messages. `globalChannelMap.get(key)` or `$gc(key)` reads it, `globalChannelMap.put(key, value)` or `$gc(key, value)` writes it. It is cleared when the channel deploys if **Clear global channel map on deploy** (Summary tab, on by default) is set, and it is never cleared on undeploy. |
| `globalMap`, `configurationMap` | All four | The server-wide map shared by every channel, and the configuration map. Shorthands `$g` and `$cfg`. |
| `logger` | All four | A Log4j logger named after the script: `deploy`, `undeploy`, `preprocessor`, or `postprocessor`. |
| `message` | Preprocessor, postprocessor | In the preprocessor, the raw inbound data as a string. In the postprocessor, the completed message as an `ImmutableMessage`; `message.getMessageId()` returns its id. |
| `sourceMap`, `channelMap`, `responseMap` | Preprocessor, postprocessor | The message's maps, shorthands `$s`, `$c`, `$r`. In the postprocessor `channelMap` is read-only: `channelMap.put(key, value)` or `$c(key, value)` throws `UnsupportedOperationException`. |
| `connectorMap` | Preprocessor | The source connector's map, shorthand `$co`, writable. Not in the postprocessor scope. |
| `SENT`, `ERROR`, `QUEUED`, `FILTERED`, `RECEIVED`, `TRANSFORMED`, `PENDING` | Postprocessor | The `Status` values, usable as bare names when building a `Response`. |

No message exists when the deploy and undeploy scripts run, so none of the message objects are in scope there.

### Deploy script
Runs once while the channel deploys, before it starts. If it throws, the deploy fails. For example, it can initialize variables or load resources.

```javascript
// Seed a value that every script in this channel reads back with $gc('sendingFacility')
globalChannelMap.put('sendingFacility', 'HOSP');
```

### Preprocessor
Runs once for every message, after the source connector receives the data and after attachment extraction, but before the message reaches the source filter/transformer. It can modify the raw inbound message. `message` is the raw inbound data as a string; nothing has been parsed yet, so there is no `msg`. The script must return the string the channel goes on to process: the returned value is stored as the message's processed raw content, which is what the source filter and transformer parse. Return `message` unchanged when there is nothing to change. A script that ends without a `return` leaves the message unchanged; see [Global Scripts](./global_scripts.md#global-preprocessor-script). `channelMap` and `connectorMap` are writable here, so a per-message fact belongs in `$c` or `$co`, where the Message Browser shows it on the message.

```javascript
// Normalize line endings in the raw string, then return it
message = message.replace(/\r?\n/g, '\r');
return message;
```

### Postprocessor
Runs once for every message after the source connector and all destinations have completed. With the source queue off, that is before the source connector sends its response. With it on, the response has already gone. The postprocessor has access to responses from all executed destinations and can return a custom response for the source connector to use. `message` is the completed message. `responseMap.get(name)` returns the `Response` a destination produced, looked up by the destination's name; a destination removed by a Destination Set Filter step has no entry and the lookup returns null. `channelMap` is read-only here and there is no `connectorMap`. If the script returns a `Response`, the engine stores it in the source response map under the key `Postprocessor`, which is what the source connector sends back when its **Response** setting is **Postprocessor**. The `Response` message is the payload the source connector sends, verbatim; a TCP Listener writes it to the socket as the reply, so a destination's ACK is passed through unchanged. The third constructor argument, `Response(status, message, statusMessage)`, is a status message that is kept on the `Response` and not sent. Return nothing and no postprocessor response is stored.

```javascript
// Read the response one destination produced and return it unchanged as the response the source connector sends back
var ehrResponse = responseMap.get('Send to EHR');
if (ehrResponse == null) {
    return new Response(ERROR, 'Message ' + message.getMessageId() + ': no response from Send to EHR');
}
return new Response(ehrResponse.getStatus(), ehrResponse.getMessage(), 'Message ' + message.getMessageId() + ': response from Send to EHR');
```

### Undeploy script
Runs once while the channel undeploys, after it has stopped. For example, it can clean up what the deploy script set up. The global channel map is not cleared on undeploy, so an entry the deploy script seeded stays until the next deploy clears it or this script removes it.

```javascript
// Remove what the deploy script seeded, then record the undeploy once
globalChannelMap.remove('sendingFacility');
logger.info(channelName + ': undeployed, sendingFacility removed from the global channel map');
```

## Response handling

The source connector's **Response** dropdown controls what is sent back to the originating system. Options include:

- **None**. No response is returned
- **Auto-generate (Before processing)**. OIE auto-generates a response from the inbound data type with a RECEIVED status, whatever happens during processing (for HL7 v2.x that is still an AA acknowledgement; only ERROR and FILTERED change the acknowledgement code). With the source queue on, it goes back as soon as the message is queued. With it off, it goes back after the message has gone through the channel
- **Auto-generate (After source transformer)**. OIE auto-generates a response from the inbound data type after the source filter/transformer runs
- **Auto-generate (Destinations completed)**. OIE auto-generates a response from the inbound data type after all destinations complete, reflecting overall processing status
- **Postprocessor**. Returns the `Response` the postprocessor script returned (see [Postprocessor](#postprocessor))
- **A specific destination**. Returns the response payload received from that destination (e.g. an ACK from a downstream system)
- **A response map variable**. Returns the value a script put in the response map under that name. The dropdown lists the names it finds in the channel's scripts

## Testing channels

### Send test messages
1. Deploy the channel
2. In the Dashboard, select the channel and click **Send Message** in the Dashboard Tasks pane
3. Type a message directly, or load one from a file using **Open Text File** or **Open Binary File**
4. Optionally select which destinations to include and inject source map variables
5. Click **Process Message**
6. Check the Message Browser for results

### Debug mode
Use the **Debug Channel** task to deploy a channel with breakpoints enabled and step through its scripts. The **Debug Channel** dialog asks you to select the channel scripts to debug: deploy, undeploy, preprocessor and postprocessor scripts; attachment and batch scripts; source connector scripts; source and destination filter/transformers; destination connector scripts; and destination response transformers.

### Message storage
**Development** storage keeps every content type, so the Message Browser shows each stage of a test message. The other modes keep less; see [Message storage modes](./message_lifecycle.md#message-storage-modes).

