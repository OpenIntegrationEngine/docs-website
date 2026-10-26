---
title: Glossary
description: Key terms used across the OIE documentation, with the engine behavior behind each one
---

# Glossary

| Term | Definition |
|---|---|
| <a id="ack"></a>**ACK** | Acknowledgment message sent back to a sender confirming receipt of a message (common in HL7) |
| <a id="attachment"></a>**Attachment** | Content stored with a message but apart from its body. The attachment handler extracts attachments as a message arrives, and a script can add or update them later. See [Attachments](./message_lifecycle.md#attachments) |
| <a id="batch"></a>**Batch** | A single inbound payload that is split into multiple messages |
| <a id="channel"></a>**Channel** | The unit of integration in OIE: one source connector and one or more destinations, each with its own filter and transformer, plus the channel scripts. Cloverleaf and Rhapsody users may know the same idea as an interface or a route |
| <a id="channel-group"></a>**Channel Group** | A named group of channels, shown in the Channels view and on the Dashboard |
| <a id="channel-map"></a>**Channel Map** | A key-value store scoped to a single message across all connectors in a channel. Shorthand `$c`. Read-only in the postprocessor |
| <a id="channel-writer-reader"></a>**Channel Writer/Reader** | Internal connectors for routing messages between channels within the same OIE instance |
| <a id="code-template"></a>**Code Template** | A reusable JavaScript function or code snippet shared across channels |
| <a id="configuration-map"></a>**Configuration Map** | Server-wide key-value pairs accessible in all channel scripts; configured in Settings. Shorthand `$cfg` |
| <a id="connector"></a>**Connector** | The source or a destination of a channel. Its type, such as TCP Listener, File Writer, or JavaScript Writer, decides its settings and what it does |
| <a id="connector-map"></a>**Connector Map** | A key-value store scoped to a single message within a single connector. Shorthand `$co` |
| <a id="dashboard"></a>**Dashboard** | The main operational view showing deployed channels and their real-time statistics |
| <a id="data-pruner"></a>**Data Pruner** | A background process that automatically removes old message data |
| <a id="data-type"></a>**Data Type** | A message format (e.g., HL7 v2.x, XML, JSON, DICOM) and the settings the engine uses to serialize and deserialize it. The data type decides what `msg` and `tmp` are: E4X XML for XML-based types, a JavaScript object for JSON, a JavaScript String object for Raw |
| <a id="deploy"></a>**Deploy** | Loading a saved channel definition into the engine. Scripts are compiled, connectors created, tables reconciled, and the channel is then started, paused, or left stopped according to its Initial State. See [Deploy, Start, and Channel State](./channel_state.md) |
| <a id="derby"></a>**Derby** | Apache Derby; the embedded database used by default for development |
| <a id="destination"></a>**Destination** | A connector that runs after the source, with its own filter and transformer. It usually sends the message somewhere, but need not: a Channel Writer left at None sends nothing. See [Connectors](./architecture_overview.md#connectors) |
| <a id="destination-set"></a>**Destination Set** | The set of destinations that will process a given message. Available on the source connector only, and modifiable from the source filter or transformer via `destinationSet` |
| <a id="dicom"></a>**DICOM** | Digital Imaging and Communications in Medicine; a standard for medical imaging |
| <a id="donkey"></a>**Donkey** | The internal message processing engine that handles queuing, storage, and message lifecycle |
| <a id="e4x"></a>**E4X** | ECMAScript for XML; the syntax used to access message fields when the data type is XML-based (HL7 v2.x, HL7 v3.x, XML, EDI/X12, NCPDP, Delimited Text, DICOM). JSON and Raw messages are not E4X |
| <a id="edi"></a>**EDI** | Electronic Data Interchange; a standard for business document exchange |
| <a id="extension"></a>**Extension** | An add-on the engine loads at startup, such as a connector, data type, or transformer step. Most built-in features ship as extensions. See [Plugin Guide](./plugins.md) |
| <a id="filter"></a>**Filter** | A set of rules that determine whether a message should be processed or rejected. Compiled into the same script as its transformer: a variable a rule assigns without `var` is still there in the transformer, while one declared with `var` stays inside its rule |
| <a id="global-channel-map"></a>**Global Channel Map** | A key-value store shared across all messages within a specific channel. Shorthand `$gc`. Held in memory, not stored with messages, and cleared when the channel deploys unless its setting says otherwise. Not present in the global deploy and undeploy scripts |
| <a id="global-map"></a>**Global Map** | A key-value store shared across all channels on the server. Shorthand `$g`. Held in memory until the server restarts, not stored with messages, and cleared on Redeploy All by default |
| <a id="hl7"></a>**HL7** | Health Level Seven; a set of international standards for healthcare data exchange |
| <a id="iterator"></a>**Iterator** | A transformer step and filter rule type that loops over repeating segments or elements |
| <a id="mapper"></a>**Mapper** | A transformer step type that extracts a value from the source message into a variable |
| <a id="message"></a>**Message** | One unit of data processed by a channel |
| <a id="message-browser"></a>**Message Browser** | The UI for searching, viewing, and managing individual messages. Channel and connector map entries appear on its Mappings tab |
| <a id="message-builder"></a>**Message Builder** | A transformer step type that sets a field in the outbound message |
| <a id="message-storage-mode"></a>**Message Storage Mode** | Controls how much message content is persisted (Development, Production, Raw, Metadata, Disabled) |
| <a id="mllp"></a>**MLLP** | Minimal Lower Layer Protocol; the standard framing protocol for HL7 over TCP |
| <a id="nack"></a>**NACK** | Negative Acknowledgment; indicates a message was received but could not be processed |
| <a id="ncpdp"></a>**NCPDP** | National Council for Prescription Drug Programs; a pharmacy transaction standard |
| <a id="oie"></a>**OIE** | Open Integration Engine; this project |
| <a id="postprocessor"></a>**Postprocessor** | A channel script that runs after all destinations have processed a message. Its source map and channel map are read-only; its response map is writable |
| <a id="preprocessor"></a>**Preprocessor** | A channel script that runs before the source filter and transformer, receiving the raw message as a String in `message` |
| <a id="pruning"></a>**Pruning** | The process of removing old message data from the database |
| <a id="queue"></a>**Queue** | A set of rows in the database, not an in-memory structure: the source queue is this connector's messages in RECEIVED status, a destination queue is that destination's messages in QUEUED status. Each keeps a small in-memory buffer filled from that query. See [Queueing](./queueing.md) |
| <a id="response"></a>**Response** | What a destination got back when it sent a message |
| <a id="response-map"></a>**Response Map** | A key-value store holding each destination's response under its `d` key, plus anything a script puts there. The source can return any entry as its response. Shorthand `$r` |
| <a id="rhino"></a>**Rhino** | Mozilla Rhino; the JavaScript engine used by OIE. Language version is set by `rhino.languageversion` in `mirth.properties` |
| <a id="rule"></a>**Rule** | A single condition within a filter (Rule Builder, JavaScript, External Script, or Iterator) |
| <a id="serialization"></a>**Serialization** | Converting a message from its inbound data type into the internal representation that filters and transformers work with: XML for every built-in data type except JSON and Raw. Deserialization is the reverse, from the internal representation to the outbound data type |
| <a id="source"></a>**Source** | The connector that receives inbound messages for a channel |
| <a id="source-map"></a>**Source Map** | A key-value store populated by the source connector with metadata (e.g., remote address). Shorthand `$s` |
| <a id="step"></a>**Step** | A single operation within a transformer (Mapper, Message Builder, JavaScript, etc.) |
| <a id="tag"></a>**Tag** | A label applied to channels, used to filter them in the Channels view and on the Dashboard |
| <a id="template"></a>**Template** | Either a transformer's outbound message template, which becomes `tmp`, or a destination connector's content field, which supports variable substitution |
| <a id="transformer"></a>**Transformer** | A sequence of steps that modify message content as it passes through a connector |
| <a id="transmission-mode"></a>**Transmission Mode** | The framing protocol used by TCP connectors (MLLP, Basic) |
| <a id="undeploy"></a>**Undeploy** | The reverse of deploy: the channel is stopped, its connectors are undeployed, its undeploy script runs, and the engine unloads it. See [Undeploy](./channel_state.md#undeploy) |
| <a id="vm"></a>**VM** | The underlying connector protocol for channel-to-channel routing; exposed in the UI as Channel Reader (source) and Channel Writer (destination) |
