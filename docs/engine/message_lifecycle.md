---
title: Message Lifecycle and Storage
description: What the engine does with a message from receipt to response, which statuses and content it records, and what each storage mode keeps
---

# Message Lifecycle and Storage

A message in OIE is one unit of data travelling through a channel. The engine records it as one message row plus one connector message per connector it passes through: a channel with a source and two destinations writes up to three connector messages for every inbound message. Each connector message has its own status, its own timestamps, and its own set of stored content, which is why the Message Browser can show the raw, transformed, encoded, and sent forms of the same message side by side.

What the engine stores at each step depends on the channel's message storage mode, and what it stores determines what it can recover after a crash, what it can queue, and what the Message Browser can show.

## Messages and connector messages

A single inbound payload does not always become a single message. When the source connector's batch processor is on, one file or stream can be split into many messages, each with its own id. See [Batch processing](#batch-processing).

Connector messages are numbered by **metadata id**. The source connector is always 0. Destinations are numbered from 1 in the order they were added to the channel.

## Statuses

Each connector message carries one status. The letter is what the database stores.

| Status | Meaning | When it is set |
|---|---|---|
| **RECEIVED** (R) | The connector message exists and processing has not finished | On creation, for the source and for every destination |
| **FILTERED** (F) | The connector's filter rejected the message | By the filter |
| **TRANSFORMED** (T) | The filter accepted and the transformer completed | By the transformer. For the source connector this is the final status on the happy path; the source never becomes SENT |
| **QUEUED** (Q) | The destination has the message and a queue thread will send it | On a destination that queues the message, after its transformer and before any send is attempted, and again whenever a send does not succeed with queueing on. With queueing Never, the stored status stays RECEIVED until the send returns |
| **SENT** (S) | The destination's send succeeded | Only from the connector's own response after a send |
| **ERROR** (E) | Processing stopped with an error | Preprocessor, filter or transformer, send with queueing off, response transformer, or a runtime failure in a chain |
| **PENDING** (P) | The destination sent the message and stored the response, but the response transformer has not finished | By the destination immediately after the response is written, only when a response transformer will run |

In PENDING the response is already on disk, so after a crash during the response transformer, recovery re-runs only the response transformer.

A message is **complete** when every one of its connector messages is FILTERED, TRANSFORMED, or SENT. That definition drives the remove-on-completion options below. QUEUED and PENDING are not complete, and neither is ERROR.

## The processing path

### Once per message, on the way in

1. The source connector receives data. If batch processing is on, the batch splitter produces one message at a time and the rest of this list repeats for each.
2. The attachment handler, if configured, extracts attachments and stores them.
3. The message row and the source connector message are written, with the source map. What remains after attachment extraction is stored as **Raw**.
4. The engine commits. With the source queue on, it responds to the sender here and a source queue thread continues later. With the source queue off, the receiving thread continues at once.
5. The preprocessor script runs. Its output becomes **Processed Raw**.
6. The source filter and transformer run. The engine serializes the content to its internal form using the inbound data type; the filter accepts or rejects; the transformer steps run; what `msg` contains at the end, or `tmp` when an outbound template is set, becomes **Transformed**, even if the filter rejected the message; the engine produces **Encoded** using the outbound data type.
7. The source connector message's status, custom metadata columns, and maps are written. A filtered or errored message has its Processed Raw and Transformed written, subject to the storage mode, and skips to the final steps.
8. Processed Raw, Transformed, and Encoded are written, subject to the storage mode.
9. One connector message is created for the first destination in each chain, each holding a copy of the source's channel map and response map. The chains then run: all chains at the same time, each chain's destinations one after another. See [Threading and Ordering](./threading_and_ordering.md).

::: info
A connector with no filter and no transformer has no Transformed content. Its Encoded content is the raw content, or the source's Processed Raw when the preprocessor produced one, unchanged apart from what the data type's properties change without serializing, such as HL7 v2.x's **Convert Line Breaks**. This shortcut applies only when the inbound and outbound data types are the same, no outbound template is set, and neither data type's properties require serializing, as **Use Strict Parser** does for HL7 v2.x.
:::

### For each destination

10. The destination's filter and transformer run against the source's Encoded content, which is this destination's Raw. When the destination queues the message, the results are stored as **Transformed** and **Encoded**, the custom metadata columns are updated, and the status becomes QUEUED; a filtered or failed message becomes FILTERED or ERROR. Otherwise **Transformed** and **Encoded** are written with the send result. With **Include Filter/Transformer** on and the message going straight to the queue, this step and the next run on the queue thread instead, on every attempt.
11. The destination builds its outgoing content from the encoded content and the maps. This happens before any send is attempted. It is stored as **Sent** at once when the message is queued, and with the send result for a direct send.
12. The send runs, with the pre-queue retries described in [Queueing](./queueing.md). The reply is stored as **Response**.
13. If the response transformer will run, the status becomes PENDING and the engine commits. It runs only when the response is not empty, or the response inbound data type is Raw, and the shortcut described above does not apply to it. The response transformer then runs, producing **Response Transformed** and **Processed Response**.
14. The custom metadata columns and maps are updated again, and the final status is written: SENT, ERROR, QUEUED, or FILTERED.
15. If another destination follows in the chain, its connector message is created with a copy of this destination's channel map and response map, and the chain continues from step 10.

### Once per message, on the way out

16. When every chain has finished, the postprocessor script runs against a merged view of all connector messages.
17. Every destination's response and the postprocessor's return value are merged into the source connector message's response map.
18. The response to send back is selected according to the source connector's **Response** setting, and the source connector delivers it.
19. The response actually returned is stored as the source's **Response**, the merged response map is stored, and the message row is marked processed. Content is removed if the channel's remove-on-completion options apply.

When the source queue is on, steps 16, 17, and 19 still happen, on the source queue thread, but the response was selected, delivered, and stored back at step 4.

## Content types

### Source connector

| Content | What it holds |
|---|---|
| **Raw** | The inbound message after attachment extraction, before the preprocessor |
| **Processed Raw** | The preprocessor's output |
| **Transformed** | The internal representation, usually XML, after the source filter and transformer ran |
| **Encoded** | The outbound form the engine produces using the outbound data type after the transformer |
| **Response** | What was returned to the sender |

### Destination connector

| Content | What it holds |
|---|---|
| **Raw** | Always the source's Encoded content. Not stored separately; the engine reads the source's row when it needs it |
| **Transformed** | The internal representation after the destination's filter and transformer ran |
| **Encoded** | The destination's outbound form after its transformer |
| **Sent** | The connector's outgoing content as built for the send, including its properties. Stored when the message is queued, and with the send result for a direct send |
| **Response** | The reply the destination got back |
| **Response Transformed** | The response in its internal representation, after the response transformer ran |
| **Processed Response** | The response after the response transformer and the response outbound data type |

Every destination starts from the same source Encoded content. What passes from one destination to the next within a chain is the channel map and response map, not the message content.

### Maps and errors

The maps and errors are stored alongside the content and stay visible in the Message Browser after processing finishes.

| Content | What it holds |
|---|---|
| **Source Map** | The source map for the message, shared by every connector message |
| **Connector Map** | This connector message's connector map |
| **Channel Map** | The channel map as it stood for this connector message |
| **Response Map** | Responses keyed by destination, as `d1`, `d2`, and so on |
| **Processing Error** | An error from the filter, transformer, or send |
| **Postprocessor Error** | An error from the postprocessor script |
| **Response Error** | An error while handling a response |

The Message Browser's **Errors** tab has a radio button for each one present: **Processing Error**, **Postprocessor Error** and **Response Error**.

::: info The global maps are not stored with the message
The global map (`$g`) and the global channel map (`$gc`) are not saved with any message. Both live in the server's memory, shared by every message (the global channel map by every message in its channel), and are gone when the server restarts. **Clear global channel map on deploy**, on by default, empties a channel's global channel map when it deploys, and **Clear global map on redeploy** in the server settings, also on by default, empties the global map on **Redeploy All**. The Dashboard's **Global Maps** tab shows their current contents.
:::

## Message storage modes

The **Message Storage** slider on the Summary tab selects one of five modes. The mode is a set of flags that decide what the engine writes and how it commits.

| | Development | Production | Raw | Metadata | Disabled |
|---|---|---|---|---|---|
| Raw | Yes | Yes | Yes | No | No |
| Processed Raw | Yes | No | No | No | No |
| Transformed | Yes | No | No | No | No |
| Encoded, source and destination | Yes | Yes | No | No | No |
| Sent | Yes | Yes | No | No | No |
| Response | Yes | Yes | No | No | No |
| Response Transformed, Processed Response | Yes | No | No | No | No |
| Source response | Yes | Yes | No | No | No |
| Maps | Yes | Yes | Source map only | No | No |
| Custom metadata columns | Yes | Yes | Yes | Yes | No |
| Message and connector message rows | Yes | Yes | Yes | Yes | No |
| Durable commits | Yes | Yes | Raw write only | No | No |
| Recovery on start | Yes | Yes | No | No | No |
| Source queue allowed | Yes | Yes | Yes | No | No |
| Destination queues allowed | Yes | Yes | No | No | No |

Attachments follow the channel's own attachment setting in every mode except Disabled.

**Durable** means the engine waits for the database to confirm each commit is on disk. When durability is off, the engine asks PostgreSQL for `synchronous_commit` off and Oracle for a batched no-wait commit on that transaction; on other databases the commit is synchronous regardless. Raw mode keeps the raw write durable and nothing else, which the Administrator describes as "Reprocess only": after a crash the raw message is still there to be reprocessed by hand, but the engine will not resume it.

**Recovery on start** is the engine picking up messages that were mid-flight when it stopped: source messages still in RECEIVED, messages whose destinations never finished, and destinations in PENDING. It runs only in Development and Production. In the other modes the engine logs that incomplete messages exist and skips them.

**Disabled** replaces the storage layer with one that writes nothing. Statistics still update. Nothing else about the message reaches the database, so the Message Browser is empty and neither queueing nor recovery is possible.

## What the database holds

Every channel gets its own set of tables, named with a local channel id that the `D_CHANNELS` table maps to the channel's id.

| Table | Contents |
|---|---|
| `d_m` | One row per message: server id, received date, whether processing finished, and the original and import ids for reprocessed and imported messages |
| `d_mm` | One row per connector message: status, connector name, received, send, and response dates, send attempts, chain and order ids |
| `d_mc` | Every stored content, map, and error, one row per content type per connector message |
| `d_mcm` | Custom metadata columns, one real database column per configured column |
| `d_ma` | Attachments |
| `d_ms` | Received, filtered, sent, and errored counts per connector, current and lifetime |
| `d_msq` | The sequence that issues message ids |

## Removing content on completion

Three options on the Summary tab remove stored data the moment a message completes, on the thread that completed it, in or immediately after the finishing transaction.

| Option | Effect |
|---|---|
| **Remove content on completion** | Deletes every stored content row for the message |
| **Filtered only** | Restricts the deletion to the connector messages that were filtered. Enabled only with the option above |
| **Remove attachments on completion** | Deletes the message's attachments |

Completion is the status test given above: every connector message FILTERED, TRANSFORMED, or SENT. A message with a queued connector message is trimmed when its last queued destination sends it, by that destination's queue thread. A message with an errored connector message is never trimmed by these options. The message and connector message rows are never removed by them either, so the message stays searchable in the Message Browser with its metadata and statuses, and only the payload is gone. The options are unavailable in Metadata and Disabled modes, where there is nothing to remove.

This is not pruning. The [Data Pruner](./data_pruning_and_maintenance.md) runs on a schedule, selects by age, and deletes the message rows themselves. The two mechanisms are independent.

## Custom metadata columns

A custom metadata column is a real column on the channel's `d_mcm` table. Each is defined on the Summary tab with a name, a type, and a mapping variable.

| Type | Stored as |
|---|---|
| STRING | Text, truncated to 255 characters |
| NUMBER | A number below 10^16 |
| BOOLEAN | True or false |
| TIMESTAMP | A date and time |

When a connector message's metadata is written, the engine looks the mapping variable up in the connector map, then the channel map, then the source map, and casts the value to the column type. A value that cannot be cast is skipped with a warning; it does not fail the message. Column names defined in the Administrator are stored in upper case. A name saved through the REST API is kept as given, and on Derby a lower-case name then makes the destination fail to write the message's metadata, leaving the message at RECEIVED. On every deploy the engine reconciles the table with the channel's definition, adding new columns, dropping removed ones, and recreating a column whose type changed, which discards its existing values.

## Attachments

An attachment is content stored with a message but apart from its body. The attachment handler extracts attachments from the raw message before anything else runs, including the preprocessor, and a script can add or update them later with `addAttachment` and `updateAttachment`. An attachment belongs to the message rather than to any one connector message and is stored once, in `d_ma`, outside the copies of content the engine keeps for each connector message. When a destination sends with **Reattach Attachments** set to Yes, the default, the engine splices the attachment back into the outgoing content. Set to No, the reference is expanded to its full `${ATTACH:channelId:messageId:attachmentId}` form instead, which a downstream channel can reattach.

## Batch processing

The batch processor lets a source connector split one inbound payload into many messages. With a streaming-capable connector, such as the File Reader or a TCP Listener using MLLP, a very large payload is read incrementally rather than loaded whole.

Turn it on with **Process Batch** in the source connector's settings. How the payload is split is controlled by the batch properties of the source inbound data type. Messages from one payload are processed one after another on the receiving thread, whatever the channel's thread settings.

Three source map variables are populated for batch messages:

- **batchId**. Shared by every message from the same payload.
- **batchSequenceId**. Counts up from 1 within the payload.
- **batchComplete**. True only for the last message.

The source connector's **Batch Response** setting chooses whether the first or the last message's response is returned to the sender.
