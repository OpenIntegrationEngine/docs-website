---
title: Deploy, Start, and Channel State
description: What deploying a channel actually does, what each state means, what Start, Stop, Pause, and Halt do to connectors and queues, and which saved changes need a redeploy
---

# Deploy, Start, and Channel State

Saving a channel stores its definition. Deploying it loads that definition into the engine: scripts are compiled, connectors are created and told they are deployed, the channel's database tables are reconciled, and the channel is started, paused, or left stopped according to its Initial State. Until a channel is deployed, the engine has not loaded it. After it is deployed, the engine runs what it loaded and does not re-read the saved definition until the next deploy, so a saved change to a connector, a transformer, a storage setting, or a code template does not reach the running channel.

## What deploy does

When one or more channels are deployed, the engine proceeds in this order.

1. Any channel in the set that is already deployed is undeployed first, and the global undeploy script then runs once. A redeploy is an undeploy followed by a deploy.
2. The global deploy script runs once, before any channel.
3. Channels with dependencies are ordered so that a channel deploys before the channels that depend on it; channels without dependencies deploy in parallel.

For each channel:

4. The channel is skipped, without error, if it is disabled.
5. The engine builds the channel from the saved definition, creating its connectors. Filters, transformers, and response transformers are compiled at this point.
6. The four channel scripts are compiled.
7. The global channel map is cleared, if the channel's setting asks for it.
8. The deploy script runs. If it throws, the deploy fails and the channel is not deployed.
9. The storage mode is checked against the queue settings; a channel whose mode cannot support its queues fails to deploy.
10. The custom metadata columns are reconciled with the channel's definition, the queues are attached to their database queries, and every connector is told it is deployed.
11. **Initial State** decides what happens next. Started: the channel is started. Paused: everything starts except the source connector. Stopped: nothing starts and the channel stays deployed but stopped.

Message recovery, which picks up messages that were mid-flight when the engine last stopped, happens during start, not deploy. A channel deployed with Initial State Stopped recovers nothing until it is started.

## States

A channel rests in one of these states.

| State | Meaning |
|---|---|
| **Undeployed** | Saved, but not loaded in the engine |
| **Started** | The source connector is accepting input and every part of the channel is running |
| **Paused** | The source connector is stopped. Everything else, including the queues, is running |
| **Stopped** | Deployed but nothing is running. Queued messages wait in the database |

The Dashboard shows the channel's state and, for each connector, whether it is running. While a task is in progress it can also show Deploying, Undeploying, Starting, Stopping, or Pausing.

## Start, Stop, Pause, Resume, Halt

| Action | What it does |
|---|---|
| **Start** | Starts the destination connectors, runs message recovery, starts the destination queues, starts the source queue, and starts the source connector last. Allowed from Stopped, or directly after deploy |
| **Stop** | Stops the source connector, then waits for every message currently in flight to finish, then stops the destination connectors and the queue threads. Nothing is abandoned. Queued rows stay in the database and resume on the next start |
| **Pause** | Stops the source connector and nothing else. In-flight messages finish, the source queue keeps draining, and the destination queues keep sending. Allowed from Started |
| **Resume** | Starts the source connector again. Allowed from Paused |
| **Halt** | Interrupts every processing and queue thread without waiting. A message interrupted mid-send may or may not have been delivered, and the engine cannot tell which; the sender gets an error or a dropped connection with no reply, although the message is stored and recovered when the channel starts again, so a duplicate is possible. The Dashboard offers Halt only while a channel, or one of its connectors, is Deploying, Undeploying, Starting, Stopping, Pausing, Syncing, or Unknown |

### Single connectors

The Dashboard allows a connector to be started or stopped on its own. For the source connector this is the same as resume and pause. A destination can be stopped on its own only if its queueing is enabled, because its messages have to go somewhere: while it is stopped, every message for that destination goes to its queue regardless of the queue mode, and sending resumes when it is started.

## Undeploy

Undeploying a channel stops it first, with the same wait for in-flight messages that Stop performs. The queues are not drained; their rows stay in the database and are picked up when the channel is deployed and started again. The connectors are told they are undeployed, the filter, transformer and response transformer objects are disposed, the undeploy script runs, and only then are the four compiled channel scripts discarded from the cache. A failure in the undeploy script is logged and recorded as an event but does not stop the undeploy.

When several channels are undeployed together, a channel is undeployed before the channels it depends on, and the global undeploy script runs once at the end.

## What a saved change needs

A change to a deployed channel takes effect on the next deploy. The table also shows when changes outside the channel take effect.

| Change | Takes effect |
|---|---|
| Any channel setting: connectors, filters, transformers, scripts, storage, threads, response, dependencies, initial state | On the next deploy |
| A code template used by the channel | On the next deploy. Code templates are copied into every compiled script at deploy time |
| The configuration map | Immediately. Every script run reads the current map |
| The global preprocessor and postprocessor | Immediately. They are recompiled when saved and looked up on every message |
| The global deploy and undeploy scripts | On the next deploy or undeploy, which is the only time they run |

The Dashboard and the Channels view both carry a **Rev Δ** column: the number of times the channel has been saved since it was deployed, calculated as the saved revision minus the deployed revision. It is highlighted when it is above zero, and also when any code template linked to the channel has changed since the deploy, since that change needs a redeploy too but does not touch the channel's own revision.

## Dependencies

The **Set Dependencies** button on the Summary tab records that one channel depends on another. The dependencies form a directed graph, and the engine refuses one that contains a cycle.

| Operation | Order |
|---|---|
| Deploy, Start, Resume | A channel goes before the channels that depend on it |
| Undeploy, Stop, Pause | A channel goes before the channels it depends on |

Channels at the same level run in parallel, and the engine waits for a whole level before moving to the next. If a channel fails to deploy or start, every channel that depends on it, directly or through another channel, is left out of that operation, and the server log names them.

## Server startup, enabled, and deployed

On startup, when `server.startupdeploy` is true, which is the default, the engine deploys every channel it has. Disabled channels are skipped. Each deployed channel then follows its Initial State, so a channel with Initial State Stopped is deployed on startup but not running.

Enabled and deployed are separate things. Enabled is metadata kept beside the channel rather than part of it; changing it does not change the channel's revision. A disabled channel is skipped by deploy, and **Deploy Channel** and **Debug Channel** leave it out, except that **Deploy Channel** in the channel editor offers to enable the channel and then deploys it. Disabling a channel that is already deployed does not undeploy it; it keeps running until it is undeployed or the server restarts. **Redeploy All** undeploys everything, clears the global map if the server setting asks for it, and then deploys every enabled channel. The global undeploy script still sees the global map values, and when the map is cleared the global deploy script sees it empty.
