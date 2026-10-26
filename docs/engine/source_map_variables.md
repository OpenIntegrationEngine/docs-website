---
title: Source and Connector Map Variables
description: Auto-populated variables per connector type
---

# Source and Connector Map Variables

Each connector type automatically populates certain map variables with metadata about the connection and message. These variables are available in transformers, filters, and scripts. Every source map also holds a `destinationSet` key, which the engine sets itself; the tables below list only the keys each connector adds.

## Source connector map variables

### TCP Listener
| Variable | Description |
|---|---|
| `remoteAddress` | IP address of the sending system |
| `remotePort` | Port of the sending system |
| `localAddress` | Local IP address |
| `localPort` | Local listening port |

### HTTP Listener
| Variable | Description |
|---|---|
| `remoteAddress` | IP address of the HTTP client |
| `remotePort` | Port of the HTTP client |
| `localAddress` | Local IP address |
| `localPort` | Local listening port |
| `method` | HTTP method (GET, POST, PUT, DELETE) |
| `url` | Request URL from the scheme through the path, without the query string |
| `uri` | Request path with its query string, or the whole URI when the request line carries an absolute URI |
| `protocol` | HTTP protocol version |
| `query` | Query string |
| `contextPath` | Path portion of the request URL |
| `parameters` | `MessageParameters` object wrapping the query and form parameters. `getParameter(name)` returns the first value, `getParameterList(name)` every value, `getKeys()` the parameter names |
| `headers` | `MessageHeaders` object wrapping the request headers, with header names matched case-insensitively. `getHeader(name)` returns the first value, `getHeaderList(name)` every value, `getKeys()` the header names |

### File Reader
| Variable | Description |
|---|---|
| `originalFilename` | Original filename of the file being read |
| `fileDirectory` | Directory the file was read from |
| `fileSize` | Size of the file in bytes |
| `fileLastModified` | Last modified time of the file, in milliseconds since the epoch |
| `pollId` | ID of the current poll cycle |
| `pollSequenceId` | Sequence number within the current poll |
| `pollComplete` | `true` on the last message in the poll cycle, absent on the others |

### Database Reader
No automatic source map variables.

### Channel Reader
| Variable | Description |
|---|---|
| `sourceChannelId` | Channel ID of the sending channel |
| `sourceChannelIds` | List of source channel IDs (when routed through multiple channels) |
| `sourceMessageId` | Message ID from the sending channel |
| `sourceMessageIds` | List of source message IDs (when routed through multiple channels) |

### JMS Listener
No automatic source map variables.

### DICOM Listener
| Variable | Description |
|---|---|
| `localApplicationEntityTitle` | Local AE title |
| `remoteApplicationEntityTitle` | Remote AE title |
| `localAddress` | Local IP address |
| `localPort` | Local listening port |
| `remoteAddress` | IP address of the sending DICOM node |
| `remotePort` | Port of the sending node |
| `associateACProtocolVersion` | ASSOCIATE-AC protocol version |
| `associateACImplClassUID` | ASSOCIATE-AC implementation class UID |
| `associateACImplVersionName` | ASSOCIATE-AC implementation version name |
| `associateACApplicationContext` | ASSOCIATE-AC application context |
| `associateACPresentationContexts` | Map of ASSOCIATE-AC presentation contexts |
| `associateRQProtocolVersion` | ASSOCIATE-RQ protocol version |
| `associateRQImplClassUID` | ASSOCIATE-RQ implementation class UID |
| `associateRQImplVersionName` | ASSOCIATE-RQ implementation version name |
| `associateRQApplicationContext` | ASSOCIATE-RQ application context |
| `associateRQPresentationContexts` | Map of ASSOCIATE-RQ presentation contexts |
| `username` | User identity username (if provided) |
| `passcode` | User identity passcode (if provided) |
| `userIdentityType` | User identity type (if provided) |

### Web Service Listener
No automatic source map variables.

### JavaScript Reader
No automatic variables. The script's return value becomes the message: a string, a `RawMessage` from `com.mirth.connect.server.userutil`, or a `java.util.List` of either. A `RawMessage` built with a source map carries it into the message; a string return has an empty source map. Returning `undefined`, `null`, or an empty string produces no message. A JavaScript array is not a `java.util.List`: it becomes one message holding text such as `org.mozilla.javascript.NativeArray@37425635`.

## Destination connector map variables

A destination connector writes these into its own `connectorMap` while it sends, after the destination's filter and transformer have run. They are readable in the destination's response transformer. In the destination's filter or transformer they are still `null`.

### HTTP Sender
| Variable | Description |
|---|---|
| `responseStatusLine` | HTTP response status line |
| `responseStatusCode` | HTTP response status code |
| `responseHeaders` | `MessageHeaders` object wrapping the response headers, with the same methods and case-insensitive matching as the HTTP Listener `headers` entry |

### TCP Sender (Server mode)
| Variable | Description |
|---|---|
| `localAddress` | The **Local Address** setting after variable replacement, so `0.0.0.0` at the default |
| `localPort` | The **Local Port** setting |
| `numberOfClients` | Total number of connected clients |
| `successfulSends` | Count of successful message sends |
| `allResponses` | List of Response objects from each connected client |

## Accessing map variables

Every preprocessor, filter, transformer and response transformer script sees the maps as the scope variables `sourceMap`, `channelMap`, `connectorMap` and `responseMap`. They are Java `Map` objects: `.get(key)` reads a value and `.put(key, value)` writes one. The shorthand functions `$s(key)`, `$c(key)`, `$co(key)` and `$r(key)` call `.get()` on the same four maps, and with a second argument they call `.put()`. A key the connector did not populate returns `null`.

### In a filter or transformer

This runs in a source or destination filter or transformer step on a channel whose source connector is a TCP Listener, which populates `remoteAddress` and `remotePort`. `sourceMap` and `channelMap` come from the script scope. Storing the value in the channel map keeps it with the message, where the Message Browser shows it.

```javascript
var remoteAddress = sourceMap.get('remoteAddress');
var remotePort = sourceMap.get('remotePort');
channelMap.put('sender', remoteAddress + ':' + remotePort);
```

### In a response transformer

The response transformer reads the HTTP Sender's `responseStatusCode`, `responseStatusLine` and `responseHeaders` from `connectorMap`, which the sender filled in during the send. A value the response transformer puts into `channelMap` is stored with this destination's message. Whether it reaches the next destination in the chain depends on the queue: the next destination's channel map is copied from this one as soon as this destination finishes its turn in the processing thread. With **Queue Messages** set to Never, or set to On Failure with an empty queue, the send and the response transformer run inside that turn, so the value travels down the chain. A destination that queues the message hands its channel map on before the send, and the value then stays on this destination's message only.

```javascript
var statusCode = connectorMap.get('responseStatusCode');
channelMap.put('httpStatus', statusCode);
```

### In templates (Velocity)

Destination connector fields that accept Velocity, such as the File Writer's file name and template or the HTTP Sender's URL and content, resolve `${key}` against the source map, channel map, connector map and response map of the connector message, in that order, so a later map wins when two hold the same key. This template runs in a File Writer on a channel whose source connector is a File Reader, which populates `originalFilename` and `fileSize`. `${originalFilename}` has a fallback: when no map holds it, the replacer substitutes the current time in milliseconds followed by `.dat`. A key that no map holds and that has no fallback is left as the literal `${key}` text.

```text
Original file: ${originalFilename}
Size: ${fileSize}
```

### In the postprocessor

The postprocessor runs against the merged message rather than one connector, so its scope holds `sourceMap`, `channelMap` and `responseMap` and no `connectorMap`. `sourceMap` and `channelMap` are read-only there: `.put()` on either, and `$c(key, value)`, throws `UnsupportedOperationException`.

## Custom map variables

A transformer step stores its own values with `.put()` on the writable maps. `channelMap` and `connectorMap` come from the script scope. `DateUtil` is `com.mirth.connect.server.userutil.DateUtil`, imported into every script scope; `getCurrentDate(pattern)` formats the current time with a `SimpleDateFormat` pattern.

```javascript
channelMap.put('processedTimestamp', DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss'));
connectorMap.put('customFlag', 'URGENT');
```

The channel map is copied from the source connector to the first destination of each chain, and from each destination to the next one in its chain, so a later step reads `processedTimestamp` with `channelMap.get('processedTimestamp')` or `$c('processedTimestamp')` and a Velocity field resolves it as `${processedTimestamp}`. The connector map belongs to one connector: `customFlag` is visible only within the connector that wrote it.

::: info
The `sourceMap` is read-only in every script: `sourceMap.put()` and `$s(key, value)` throw `UnsupportedOperationException`. Use `channelMap` for values every connector in the channel needs, and `connectorMap` for values scoped to the current connector.
:::
