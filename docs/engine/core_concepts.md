---
meta-description: The building blocks of Open Integration Engine — channels, connectors, messages, filters, transformers and maps
title: Core Concepts | Open Integration Engine
---

# Core Concepts

Before installing OIE or opening the Administrator, it helps to understand the small set of building blocks everything else is made of. This page explains them once, in plain terms, so later pages can just use the vocabulary.

## What an integration engine does

Healthcare systems rarely speak the same language. A lab system might send results as HL7v2, a scheduling system might expect JSON over HTTP, and a billing system might only read flat files dropped into a folder. An integration engine sits between these systems, receives a message from one, reshapes it, and delivers it to another without either system knowing the other exists.

OIE does this work inside **channels**.

## Channels

A channel is the unit of integration in OIE. Each channel has exactly one job: receive messages from somewhere, do something to them, and send the result somewhere else.

Every channel has the same three-part shape:

- **One source connector** — where messages come from
- **Zero or more transformation steps** — filters and transformers that inspect, validate, and reshape the message
- **One or more destination connectors** — where the message goes after processing

Channels run independently of one another. A busy channel processing lab results does not slow down a quiet channel polling a folder once an hour. Because channels are independent, most integrations are built as many small, single-purpose channels rather than one large one mirroring the "one interface per channel" convention used in other engines like Rhapsody and Cloverleaf.

::: tip Channels vs. interfaces
If you've used Cloverleaf or Rhapsody, a **channel** is the same idea as an **interface** or **route**: a self-contained path a message travels from one system to another.
:::

## Messages

A message is a single unit of data moving through a channel. This could be one HL7 ADT event, one FHIR resource, one row read from a file. As a message moves through a channel, OIE keeps a copy of it at each stage:

- **Raw** — exactly as received from the source, untouched
- **Transformed** — after the source connector's transformer has run
- **Encoded** — the final form handed to each destination
- **Response** — anything a destination sends back (e.g. an HL7 ACK, an HTTP status code)

More stages are available depending on the channel configuration.

Keeping every stage means a message can be inspected later to see exactly what it looked like at each point, which is invaluable when tracing why a downstream system rejected something.

## Connectors

A connector is what actually talks to the outside world. OIE ships with connectors for the protocols healthcare integrations commonly need:

| Type | Examples |
|---|---|
| Network | TCP/MLLP, HTTP/S, Web Service (SOAP) |
| File-based | File Reader/Writer, FTP/SFTP |
| Data | Database Reader/Writer |
| Messaging | JMS |
| Email | SMTP |
| Imaging | DICOM |

Every channel has exactly one **source connector**, which listens for or polls for incoming data, and can have multiple **destination connectors**, so a single incoming message can be delivered to several downstream systems at once.

## Filters and transformers

Once a message enters a channel, it passes through two kinds of steps before delivery:

- **Filters** decide whether a message should continue at all. A filter step evaluates a rule (e.g. "only continue if MSH-9 equals ADT^A01") and either lets the message through or stops it.
- **Transformers** reshape the message — mapping one segment to another, converting XML to JSON, renaming fields, or running custom logic.

Both source and destination connectors have their own filter/transformer pair, so a message can be validated once when it arrives and reshaped differently for each destination it's sent to.

## Scripting

Filters and transformers are built from **steps**, and most step types (Mapper, Rule Builder, Message Builder, JavaScript) ultimately compile down to JavaScript. OIE runs this JavaScript inside the same JVM as the server, giving scripts direct access to the message tree and to built-in objects like `channelMap` and `logger`.

Beyond per-message logic, OIE supports **global scripts** that run at specific lifecycle events rather than per message:

- **Deploy / Undeploy** — runs once when a channel starts or stops
- **Preprocessor / Postprocessor** — runs before/after every message in every channel
- **Attachment** — controls how binary or large content is extracted from a message

## Maps

Because a message passes through several independent steps, OIE provides **maps** - key/value stores scoped to different lifetimes so one step can pass information to a later one.

| Map | Scope |
|---|---|
| Connector Map | One connector, one message |
| Channel Map | The whole message, across all connectors |
| Source Map | Read-only property values received when a message is received  |
| Response Map | Responses returned by destinations |
| Global Map | Every channel, for the life of the server |
| Global Channel Map | Every message within one specific channel |
| Configuration Map | Static values set once, read everywhere (e.g. environment settings) |

A common pattern: read a patient ID in the source transformer and store it in the **channel map**, then reference it later in a destination's filter without re-parsing the message.

## Code templates

Script logic that's reused across multiple channels. This could be a date-formatting helper, a lookup function, a validation routine and more which doesn't need to be copied into every channel. **Code templates** hold shared JavaScript functions in one place, grouped into libraries, and any channel can be given access to a library.

## Data types

A channel's source and each destination declare a **data type**, which tells OIE how to parse and serialize the message. This is what allows a single message to enter as HL7v2 and leave as JSON without hand-written parsing code. Supported data types include:

- Raw (no parsing)
- HL7 v2.x
- HL7 v3 / CDA
- XML
- JSON
- Delimited Text (CSV-style)
- NCPDP Telecom
- EDI/X12
- DICOM

## How it fits together

A single message's journey through a channel looks like this:

1. **Source connector** receives raw data (e.g. an MLLP connection delivers an HL7 message).
2. **Source filter/transformer** validates and reshapes it, optionally storing values in the channel map.
3. OIE routes the transformed message to each enabled **destination connector**.
4. Each **destination's filter/transformer** independently decides whether to send, and in what shape.
5. Each **destination connector** delivers the message and captures any response.
6. The source connector, if the protocol supports it, sends an acknowledgment back to the originating system.

<!-- When you are ready, the 'Developing in OIE' page going into more depth on the core concepts above. -->

## Next steps

Now that the vocabulary is in place, continue to [Installation](/engine/installation.html) to get a server running, or skip ahead to build your first channel.