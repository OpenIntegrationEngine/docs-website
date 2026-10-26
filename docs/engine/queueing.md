---
title: Queueing
description: How the source queue and destination queues work, what QUEUED means, and what ordering the engine promises
---

# Queueing

A queue in OIE is not a structure that holds messages in memory. It is a database query for this connector's messages that are still waiting. The source queue is the set of source connector messages in RECEIVED status for this server. A destination queue is the set of that destination's connector messages in QUEUED status. Each queue keeps a small in-memory buffer, 1000 rows by default, filled from that query in message id order. The Queued figure on the Dashboard is the row count in the database, not the size of the buffer.

Because the queue is the database, nothing is lost when a channel stops, is undeployed, or the server restarts. The rows stay where they are and the buffer is rebuilt the next time the queue starts.

## The source queue

The setting is on the **Source** tab under Source Settings, labelled **Source Queue**, with two options.

| Option | What happens to a message |
|---|---|
| **OFF (Respond after processing)** | The thread that received the message runs the whole channel: preprocessor, source filter and transformer, every destination chain, postprocessor. The sender waits for all of it, and its response can come from any point in that path. |
| **ON (Respond before processing)** | The engine writes the raw message, responds to the sender at once, and processes the message later on a source queue thread. |

With the queue on, the sender's response is limited to **None** or **Auto-generate (Before processing)**, because nothing else exists yet when the response goes back. The Administrator restricts the Response list accordingly.

The number of source queue threads equals **Max Processing Threads**. With more than one, messages leave the queue in id order but are processed at the same time, so order is not preserved. See [Threading and Ordering](./threading_and_ordering.md).

Recovery of source connector messages left in RECEIVED takes one of two paths, and which one runs depends on whether the source queue is on.

With the source queue on, the queue picks up the source connector messages still in RECEIVED when it starts, and processes them. This path works wherever a source queue is allowed at all, which includes Raw storage mode. In Development and Production, recovery also handles messages whose destinations never finished and destinations left in PENDING, working through all three kinds in message id order, so a RECEIVED source row older than the last of those is processed by recovery in its turn rather than by the queue.

With the source queue off, the recovery task reprocesses those rows itself, and only then does the storage mode matter. That path is disabled in Raw and Metadata modes, so it runs in Development and Production only.

**Queue Buffer Size** sets the in-memory buffer for this channel and is enabled only when the queue is on. It defaults to the server setting **Default Queue Buffer Size**, `server.queuebuffersize`, which is 1000 unless changed. The same default applies to destination queues.

## Destination queues

### Queue modes

**Queue Messages** on each destination has three options. An exported channel stores them as two booleans, `queueEnabled` and `sendFirst`.

| Option | Behavior |
|---|---|
| **Never** | Queueing off. The message is sent on the processing thread. A failure, after any retries, ends in ERROR. |
| **On Failure** | Try to send on the processing thread first. If that fails, or if the queue already holds messages, the message goes to the queue. |
| **Always** | The message goes to the queue at once and is sent by a queue thread. |

On Failure attempts a direct send only while the queue is empty, which includes having no message that a queue thread is still sending. Once a backlog exists, every new message goes straight to the back of the queue, so a new message does not jump ahead of older ones.

With Always, and with On Failure while a backlog exists, the next destination in the same chain runs without waiting for the send, and later destinations in the chain see this destination's response as QUEUED. The postprocessor usually sees QUEUED too, but not always: the queue works on the same in-memory message, so if a queue thread sends it before the postprocessor runs, the postprocessor sees the real response. The destination's own response transformer, which runs after the send, is the one script certain to see the real response.

### How a failed send becomes QUEUED

Most destination connectors report a failed send as QUEUED and a successful one as SENT. When queueing is Never, the engine converts a QUEUED result to ERROR. So the same transport failure produces ERROR on a destination whose queueing is Never and QUEUED on one with queueing on.

A few results are ERROR in every queue mode: a JavaScript Writer script that throws or returns ERROR, a TCP Sender response timeout with **Queue on Response Timeout** set to No, a SOAP fault returned to a Web Service Sender, and an HL7 v2.x response that **Validate Response** finds to be an error or rejected acknowledgement or to carry the wrong message control id.

### Retry Count and Retry Interval

Two fields in Advanced Queue Settings govern the attempts made on the processing thread, before the message is queued or errored.

| Field | Default | Effect |
|---|---|---|
| **Retry Count Before Queue/Error** | 0 | Extra attempts made on the processing thread. With Never, exhausting them produces ERROR. With On Failure, exhausting them queues the message. |
| **Retry Interval (ms)** | 10000 | Wait between those attempts, and also the wait a queue thread observes between attempts on the same message. |

Once a message is in the queue, retries are unlimited. No counter applies to queue attempts and a queued message never becomes ERROR because retries ran out. It is retried for as long as each attempt comes back QUEUED, or until someone removes it. A queue thread produces ERROR when an attempt itself reports ERROR, as described above, when the response transformer throws or sets the status to ERROR, when the re-run filter or transformer fails with Include Filter/Transformer on, when the destination's connector type changed after the message was queued, or when the message was queued before Include Filter/Transformer was turned off and was never transformed.

### Queue threads and the thread assignment variable

**Queue Threads** sets how many threads send from this queue. The default is 1. Above 1, message order is not preserved unless a **Thread Assignment Variable** is set.

The variable names a map entry that the engine reads for each queued message, searching the response map, connector map, channel map, source map, global channel map, global map, and configuration map in that order. Messages with the same value always go to the same thread, so they send in order relative to each other. The first N distinct values each get a thread of their own, where N is the thread count. Values after that are hashed onto the threads, so two unrelated values can share one. Messages that have no value for the variable all share a single thread, so they stay in order relative to each other but do not parallelise.

When **Regenerate Template** is off, the variable's name is read from the sent content stored when the message was queued, not from the current channel, so changing the variable after messages have queued does not re-sort them.

### Rotate Queue, Regenerate Template, Include Filter/Transformer

**Rotate Queue** moves on to the next message after a failure instead of retrying the same one. It is implemented as a window over message ids: the queue works through the ids present when the pass started, then wraps to the beginning. Messages that arrive during a pass wait for the next one. Rotation does not keep order; the setting's own tooltip says to disable it if the order of messages is important.

**Regenerate Template** rebuilds the destination's message from the current maps on every attempt, instead of resending the content built when the message was queued. **Include Filter/Transformer** re-runs the destination filter and transformer on every attempt. It requires Regenerate Template. Turning it off later forces any queued message that was never transformed to ERROR on its next attempt.

### What order the engine promises

| Configuration | Order |
|---|---|
| One queue thread, rotate off | Strict order by message id. A message that keeps failing blocks everything behind it. |
| Several threads, no assignment variable | None. Every thread takes the next available message. |
| Several threads with an assignment variable, rotate off | In order for messages sharing a value. No order across values. |
| Rotate on, any thread count | None. |
| Source queue with Max Processing Threads above 1 | None. The source queue has no assignment variable. |

## Message storage mode

A queue re-reads the message from the database later, so it needs the content that a send is built from. The engine checks this at deploy and refuses a channel whose storage mode cannot support its queues.

| Storage mode | Source queue | Destination queues |
|---|---|---|
| Development | Allowed | Allowed |
| Production | Allowed | Allowed |
| Raw | Allowed | Refused |
| Metadata | Refused | Refused |
| Disabled | Refused | Refused |

The source queue needs the raw content stored, plus either the maps or a durable raw write. A destination queue needs the source's encoded content, the sent content, and the maps. Raw mode keeps only raw content, which is why it can carry a source queue and not a destination queue.

The Administrator shows "Disable source queueing before using this mode" (or destination queueing) beside the Message Storage slider, and refuses to save the channel until the queueing is disabled. The deploy-time check catches channels imported through the API or CLI. See [Message Lifecycle and Storage](./message_lifecycle.md) for what each mode keeps.

## Queues through the channel's states

| State or action | Source queue | Destination queues |
|---|---|---|
| **Started** | Draining | Draining |
| **Paused** | Draining | Draining |
| **Stopped** | Threads stopped. Rows stay in RECEIVED. | Threads stopped. Rows stay in QUEUED. |
| **Halt** | Threads interrupted, possibly mid-message | Threads interrupted, possibly mid-send |
| **Undeployed** | As Stopped | As Stopped |
| Initial state **Paused** | Starts and drains | Start and drain |
| Initial state **Stopped** | Does not start | Do not start |

Pause stops only the source connector, so a paused channel accepts nothing new but keeps working through both queues. Stop waits for in-flight messages to finish, then stops the queue threads. Halt does not wait: a message interrupted mid-send may or may not have been delivered, so a duplicate is possible.

A single destination can be stopped on its own only when its queueing is enabled. While it is stopped, every message for it goes to its queue regardless of mode, and nothing sends until it is started again.

## Other behavior

- The Data Pruner never removes a message that has a connector message in QUEUED or PENDING status. ERROR is also skipped by default, but unlike the other two it can be pruned when a channel is configured to prune errored messages. A queue that never drains keeps growing the database.
- Queues are scoped to a server id. Each server processes only the rows it wrote.
- Removing a queued message from the Message Browser, or removing all messages, is handled by the queue but logs an error for the interrupted attempt with the text "This error is expected if the message was manually removed from the queue." Remove All Messages acts only on stopped channels unless **Include selected channels that are not stopped** is checked, in which case each running channel is stopped temporarily while its messages are removed.
- Reducing a queue's buffer size below the current buffer contents clears the buffer; it refills from the database.
