---
title: Frequently Asked Questions
description: Short answers to the questions that come up most often, with links to the pages that cover them properly
---

# Frequently Asked Questions

## General

### What is the relationship between OIE and Mirth Connect?
OIE is an open-source fork of Mirth Connect, created after Mirth Connect moved to a proprietary model. It continues under the Mozilla Public License 2.0. See [Migrating from Mirth Connect](./migrating_from_mirth_connect.md) to move an existing server.

### What Java version is required?
Java 17 or later.

### What databases are supported?
Apache Derby (embedded, the default), PostgreSQL, MySQL, Oracle, and SQL Server. See [Database Support](./database_support.md).

### Is OIE free to use?
Yes, under MPL 2.0, which allows free use, modification, and distribution.

## Installation and setup

### What are the default login credentials?
The user is `admin`. On a new database its password is generated at first start and written once to the console and to `logs/mirth.log`, unless `server.initialadminpassword` was set in `conf/mirth.properties` beforehand. A database upgraded from an earlier release keeps its existing passwords. Every user sets a new password at first login. See [Initial admin password](./accessing_the_administrator.md#initial-admin-password).

### What are the default ports?
`8080` for HTTP (status page and `webstart.jnlp`) and `8443` for HTTPS (REST API and Administrator connections). The [Web Administrator](./web_administrator.md) is a separate application that reaches the engine through the REST API on `8443`.

### Do I have to use the desktop Administrator?
No. The [Web Administrator](./web_administrator.md) is a separate application that provides the same administration in a browser. Both clients work against the same engine at the same time, so there is no cutover. Scripted and headless administration goes through the [CLI](./command_line_interface.md) or the [REST API](./rest_api.md).

### Should I use Derby in production?
No. Derby is for development and evaluation. Use PostgreSQL, MySQL, Oracle, or SQL Server in production. See [Database Support](./database_support.md).

### How do I change the database after installation?
Update `database`, `database.url`, `database.username`, and `database.password` in `conf/mirth.properties` and restart. See [Server Configuration](./server_configuration.md).

### How do I reset the admin password?
From the CLI: `user changepw admin "a-new-password-here"`. The new password must meet the [password policy](./user_management.md#password-policy).

## Channels

### What is a channel?
The fundamental processing unit: how messages are received (source connector), how they are transformed, and where they are sent (destination connectors). See [Channels](./channels.md).

### How many destinations can a channel have?
No hard limit. Destinations process in order by default and can be configured to run in parallel.

### What is the difference between Deploy and Start?
Deploying turns a saved channel definition into a running object: scripts are compiled, connectors created, tables reconciled. Whether the channel then runs is decided by its **Initial State**, so a deploy can leave it started, paused, or stopped. Start acts on an already-deployed channel. See [Deploy, Start, and Channel State](./channel_state.md).

### How do I pass data between channels?
Use the Channel Writer (destination) and Channel Reader (source) connectors, or `router` (a `VMRouter`) to route programmatically. The global map can share state, but it is not a message-passing mechanism.

### What happens when a destination fails?
It depends on the queue settings: marked ERROR immediately with no queue, placed in the queue for retry with queue-on-failure, or already queued with always-queue. See [Queueing](./queueing.md).

### What is the difference between the source filter and destination filter?
The source filter runs once and decides whether the message is processed at all. Destination filters run per destination and decide whether each one processes it.

### How do I route a message to only some destinations?
Use destination filters, or remove destinations from the source filter or transformer with `destinationSet`. It exists on the source connector only:

```javascript
// Source filter or source transformer
destinationSet.remove(['Destination 2']);
```

`remove` also takes a single name or metadata id, and `removeAllExcept` inverts the selection.

## Transformers and scripts

### What is the difference between `msg` and `tmp`?
`msg` is the parsed inbound message. `tmp` is the parsed outbound template, and it exists only when the transformer has an outbound template configured. When it exists, the transformer's output is taken from `tmp` rather than `msg`. Both are modifiable.

Because a connector's filter and transformer are compiled into one script sharing one scope, `tmp` is reachable from the filter too, and a change made there is still in place when the transformer runs.

### What JavaScript engine does OIE use?
Mozilla Rhino, configured for ES6 by default, set by `rhino.languageversion` in `mirth.properties`.

### Can I use Java classes in my JavaScript?
Yes. Rhino runs on the JVM:

```javascript
var uuid = java.util.UUID.randomUUID().toString();
```

### What is E4X?
ECMAScript for XML, the syntax used to read and modify message content when the data type is XML-based: HL7 v2.x, HL7 v3.x, XML, EDI/X12, NCPDP, Delimited Text, and DICOM. It is not universal. With the JSON data type `msg` and `tmp` are ordinary JavaScript objects, and with Raw they are Strings, so bracket paths do not apply. See [Data Types and Formats](./data_types_and_formats.md).

```javascript
// Transformer, HL7 v2.x inbound data type
var value = msg['PID']['PID.5']['PID.5.1'].toString();
```

### How do I add a segment to an HL7 message?
Use E4X to create and append segments in a JavaScript transformer step. See the [Script Scope and User API](./script_scope_and_user_api.md).

### How do I delete a segment from an HL7 message?
With the `delete` keyword:

```javascript
// Transformer with an HL7 v2.x outbound template, so tmp exists
delete tmp['ZZ1'];
```

## Data types

### What data types are supported?
HL7 v2.x, HL7 v3.x, DICOM, XML, JSON, EDI/X12, NCPDP, Delimited Text, and Raw. See [Data Types and Formats](./data_types_and_formats.md).

### Can I convert between data types in a single channel?
Yes. Set different inbound and outbound data types per connector. Converting HL7 to XML needs no code. The engine does not convert HL7 or XML to JSON for you: build the JSON in a transformer step.

## Performance

### How do I improve channel throughput?
- Set Message Storage to the minimum level you need
- Use attachment handlers for large content
- Enable source queuing where an auto-generated ACK is acceptable
- Enable destination queuing where you do not need a synchronous response
- Raise Max Processing Threads where message order does not matter
- Raise Queue Threads where the downstream system tolerates parallel connections
- Uncheck Wait for previous destination unless ordering between destinations matters
- Use custom metadata columns for fields you search often

### What Message Storage mode should I use?
| Environment | Mode |
|---|---|
| Development and testing | Development (stores everything) |
| Production, troubleshooting needed | Production (raw, encoded, sent, response and maps) |
| Production, high throughput | Raw or Metadata |
| Maximum performance | Disabled (no storage) |

Metadata and Disabled store no message content, so a message processed in either mode cannot be reprocessed. Raw keeps the raw content, which is enough to reprocess it. See [Message storage modes](./message_lifecycle.md#message-storage-modes).

### How do I handle large messages?
Use an attachment handler to extract large content from the message body and store it separately.

## Security

### How do I replace the self-signed TLS certificate?
Import a CA-signed certificate into the keystore with Java's `keytool`, or use a certificate management extension if you have one installed.

### How do I encrypt the database password in `mirth.properties`?
Set `encryption.properties = 1` in `mirth.properties`. On the next start the server rewrites `database.password` as an `{enc}` value, encrypted with the key in its keystore. It is off by default. See [Security and Compliance](./security_and_compliance.md).

### Is OIE HIPAA compliant?
OIE provides technical controls that support HIPAA compliance (encryption, access control, audit logging). Compliance also requires organizational policies and procedures, and is a property of your deployment rather than of the software. See [Security and Compliance](./security_and_compliance.md).

## Maintenance

### How do I back up my OIE instance?
1. Export the server configuration from the CLI: `exportcfg "backup.xml"`
2. Back up the `appdata/` directory, which holds the keystore and the embedded database if you use Derby
3. Back up `conf/mirth.properties`
4. Back up the external database separately if you use one

Without the keystore, encrypted content in a restored database cannot be read.

### How do I prevent the database from growing too large?
Enable the Data Pruner and configure per-channel policies, pruning content sooner than metadata. See [Data Pruning and Maintenance](./data_pruning_and_maintenance.md).
