---
title: Threading and Ordering
description: Which thread processes a message, what runs in parallel, which order is kept, and how the response to the sender is chosen
---

# Threading and Ordering

There is no central pool of worker threads in the engine. With the source queue off, the thread that receives a message is the thread that processes it: it runs the preprocessor, the source filter and transformer, the destination chains, and the postprocessor, and it returns the response to the sender. With the source queue on, the receiving thread stores the message and responds, and a source queue thread does the rest. Parallelism comes from three places, each with its own setting: how many receiving threads may be inside a channel at once, how the destinations are grouped into chains, and how many threads drain each destination queue.

Each of those settings trades order for throughput.

## Max Processing Threads

**Max Processing Threads** on the Source tab is a limit, not a pool. The engine holds a fair semaphore with that many permits. With the source queue off, every message acquires one on the way in and releases it after the response has gone back, so with the default of 1 a channel processes one message at a time and the sender of the next waits. With a higher value, that many receiving threads run through the channel at the same time. With the source queue on, a receiving thread holds a permit only while it stores and queues the message, and the source queue threads process messages without taking one.

Messages acquire permits in arrival order and then run concurrently, so they complete, send, and respond in whatever order they finish. Source queue threads behave the same way: they take messages from the queue in order and process them concurrently. The setting's own tooltip says that message order is not guaranteed above 1.

With the source queue on, the same number also sets how many source queue threads drain the queue. One connector is different: the Web Service Listener sizes a real thread pool from this value, four larger than the setting.

The permit count is fixed when the channel is deployed.

## Destination chains

Each destination has a **Wait for previous destination** checkbox. It is checked by default and has no effect on the first enabled destination. Chains are built from enabled destinations only: every one with the box unchecked starts a new chain, and every one with it checked joins the chain of the nearest enabled destination above it. The Destinations table shows the resulting chain number in its **Chain** column.

Chains run at the same time. Within a chain, destinations run one after another: the next destination's connector message is created only once the previous destination has finished with the message on this thread, by sending it, filtering it, failing, or putting it in its queue. A destination that queues the message does not hold up its chain. The next destination runs straight away, before the queued send happens. The engine hands all chains but the last to a per-channel thread pool and runs the last chain on the thread processing the message, then waits for every chain before moving on to the postprocessor.

A destination that filters the message does not stop its chain, and neither does a send that ends in ERROR or an error in the response transformer; the next destination still runs. A destination whose filter or transformer errors, or that fails with a runtime exception, stops its chain, and the destinations after it are not processed for that message.

### What a later destination sees

When the engine creates the connector message for the next destination in a chain, it gives it:

| Data | What the next destination gets |
|---|---|
| Source map | The same map, shared by every connector message. It is read-only |
| Channel map | A copy of the previous destination's channel map, including anything its transformer added |
| Response map | A copy of the previous destination's response map, including that destination's own response under its `d` key, for instance `d1`. If that destination queued the message, the entry is a placeholder QUEUED response |
| Raw content | The source's Encoded content, the same starting point every destination gets |

Because these are copies, nothing a later destination writes reaches an earlier one, and nothing crosses between chains while they run. The first destination of every chain starts from copies of the source connector message's maps. The global map and the global channel map are not copied: every chain and every message reads and writes the same live maps.

After the chains finish, the postprocessor sees a merged connector message built by sorting all connector messages by chain and then by position within the chain and merging their maps in that order. The merged result is the same regardless of which chain finished first.

## Responding to the sender

The **Response** setting on the Source tab chooses what goes back to the system that sent the message.

| Option | Response |
|---|---|
| **None** | Nothing is returned |
| **Auto-generate (Before processing)** | An acknowledgement generated from the raw message with a successful status, whatever happens to the message. With the source queue on it goes back before processing; with it off it goes back once processing has finished, like the other options |
| **Auto-generate (After source transformer)** | An acknowledgement whose status reflects the source filter and transformer |
| **Auto-generate (Destinations completed)** | An acknowledgement whose status reflects the destinations, resolved in the order ERROR, then QUEUED, then SENT, then FILTERED. One errored destination makes the response an error; one queued destination makes it queued. If the message reached no destination, for example because the source filter rejected it, the response is an error |
| **Postprocessor** | Whatever the postprocessor script returned |
| A destination | That destination's response. Stored as the destination's `d` key rather than its name |
| A response map variable | The value a filter rule, transformer step, or script put in the response map under that name. The list offers each such name the Administrator finds in the channel |

The response is selected after the postprocessor, once every chain has finished, and the source connector then delivers it. With the source queue on, only **None** and **Auto-generate (Before processing)** are offered, because the response leaves before anything else has run. See [Queueing](./queueing.md).

## Batch messages

Messages produced from one payload by the batch processor are dispatched one after another on the receiving thread, each finishing before the next is read, whatever the value of Max Processing Threads. Separate payloads can be in progress at the same time; there is no limit on concurrent batches. Each batch message still takes a permit, so with Max Processing Threads at 1, messages from two payloads that arrive together take turns. With the source queue on, batch messages are only enqueued in order and are then processed by the source queue threads, so with more than one queue thread their order is not kept.

## Destination queue threads

A destination with queueing on sends from its own queue threads rather than from the receiving thread. **Queue Threads** and the **Thread Assignment Variable** decide how many and in what order; [Queueing](./queueing.md) covers them. The engine estimates how many threads can be sending for one destination at once as follows, and the File Writer sizes its connection pool from that estimate:

| Queue mode | Estimated sending threads |
|---|---|
| Never | Max Processing Threads |
| Always | Queue Threads |
| On Failure | The larger of the two. Receiving threads send directly only while the queue is empty and queue threads only while it is not, but a direct send already under way can overlap with queue threads starting on newly queued messages |

## Thread names

The engine names its threads after the channel and connector they are working for. The `<` suffix marks a borrowed thread that is renamed back when the task finishes.

| Thread name | What it is doing |
|---|---|
| `Channel Dispatch Thread on <channel> (<id>) < <original name>`, or `Channel Dispatch Thread < <original name>` when the original name already contains the channel id, as a listener's thread name does | A receiving thread processing a message |
| `Source Queue Thread <n> on <channel> (<id>)` | Draining the source queue |
| `Destination Chain Thread <n> on <channel> (<id>) < <original name>` | Running a destination chain. The last chain runs on the thread processing the message, renamed the same way |
| `<connector type> Process Thread on <channel> (<id>), <destination> (<metadata id>)` | Inside one destination's send |
| `Destination Queue Thread <n> on <channel> (<id>), <destination> (<metadata id>)` | Draining a destination queue |
| `Recovery Task Thread on <channel> (<id>)` | Recovering messages during start |
| `Recovery Task Destination Chain Thread on <channel> (<id>) < <original name>` | Running a destination chain for a recovered message |
| `Channel <task> Thread on (<id>) < <original name>`, where the task is `DeployTask`, `UndeployTask`, `ChannelStatusTask` (start, stop, pause, resume), `ConnectorStatusTask` (one connector, with `connector (<metadata id>)` after the id), or `HaltTask` | A lifecycle task for the channel |
| `<connector type> Polling Thread on <channel> (<id>)` | A polling source connector's scheduled poll |
| `TCP Receiver Thread on ...`, `HTTP Receiver Thread on ...`, and the same for JMS and Web Service | A listening source connector waiting for input |
| `Statistics Updater Thread` | The server-wide statistics writer |

## Where the threads live

Every pool is per channel. The chain pool is created when the channel starts and shut down when it stops. Lifecycle tasks such as deploy, start, and stop run on one thread per channel, so tasks for the same channel run one after another while different channels proceed in parallel. Halt is the exception: it interrupts the channel's running task, cancels any still waiting, and runs at once. There is no server-wide pool for message processing. The one server-wide limit is on deleting messages: Remove All Messages on a deployed channel, Remove Results, Remove Message, and the REST API's message removal share a two-permit semaphore, so no more than two such removals run at once across the whole server. Remove All Messages on a channel that is not deployed takes no permit. The Data Pruner does not take a permit.
