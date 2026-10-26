---
title: Velocity Variable Replacement
description: Template variable syntax and usage
---

# Velocity Variable Replacement

OIE replaces `${...}` references with **Apache Velocity** in connector settings and alert templates: templates, file names, directory paths, URLs, headers, and the other fields listed under [Where Velocity is used](#where-velocity-is-used). It does not replace them in filter or transformer code. A `${name}` inside a JavaScript step, a Mapper mapping or a Message Builder mapping stays as literal text; read the value with `$('name')` or the map's `get` instead.

## Basic syntax

Variables stored in maps are referenced using the `${}` syntax:

```text
${variableName}
```

This pulls the value from the variable maps (see [Variable Map Priority](#variable-map-priority) below).

A key you name yourself, such as `patientId`, is in a map only because a transformer step stored it: a [Mapper step](./filters_and_transformers.md#mapper-step) writes to the map chosen by its scope setting (the channel map by default), and a JavaScript step calls `channelMap.put('patientId', value)`.

## Variable map priority

When you reference `${variableName}` in a message-level field, OIE loads all variable maps into a single Velocity context. Maps loaded later overwrite earlier values for the same key, so later maps have higher priority. The effective priority from highest to lowest is:

1. **Response Map**: Destination response data
2. **Connector Map**: Variables scoped to the current connector
3. **Channel Map**: Variables scoped to the current message across all connectors
4. **Source Map**: Variables populated by the source connector (e.g., remote address, original filename)
5. **[Global Channel Map](./glossary.md#global-channel-map)**: Variables shared across all messages in this channel
6. **Global Map**: Variables shared across all channels
7. **Configuration Map**: Server-wide key-value pairs from Settings

If no match is found, the literal string `${variableName}` is output.

The list applies to message-level fields. An alert template gets the alert's own variables, the utility variables below, and the global and configuration maps, but no message maps or global channel map. The alert variables are listed under [Alert variables](./alerts_and_notifications.md#alert-variables).

A template with a Velocity syntax error is not replaced at all: the engine uses the field's text as written. It logs `Could not replace template values` at WARN, but with the shipped logging configuration that line does not appear; the server log shows Velocity's own error line instead.

Replacement runs only on text that contains a `$`. A field with `#if` or `#foreach` but no `$` anywhere is used exactly as typed.

## Standard variables and templates

The utility variables `date`, `DATE`, `COUNT`, `UUID` and `SYSTIME` go into the context first, so a key with the same name in any map replaces them. `message`, `channelId`, `channelName` and `HASH` go in after the configuration, global and global channel maps and before the source, channel, connector and response maps, so only a key in one of those four per-message maps replaces them. `originalFilename` is set to its timestamp default only when no map supplied one. The `message` properties, `${HASH}` and `${originalFilename}` exist only when a template is replaced for a connector message, as the destination connector fields in the examples below are. A field replaced without a message, such as the File Reader directory, gets the utility variables, `${channelId}`, `${channelName}`, and the global channel, global and configuration maps only. There `${channelId}` and `${channelName}` go in before the global channel map, so a global channel map key with the same name replaces them.

### Message properties

| Variable | Description |
|---|---|
| `${message.messageId}` | The current message ID |
| `${message.encodedData}` | The encoded (outbound) message content |
| `${message.rawData}` | The raw inbound message content |
| `${message.transformedData}` | The transformed message content |
| `${message.channelId}` | The channel ID for this message |
| `${message.channelName}` | The channel name for this message |
| `${message.connectorName}` | The name of the current connector |
| `${message.metaDataId}` | The metadata ID of the current connector |
| `${channelId}` | The current channel's UUID |
| `${channelName}` | The current channel's name |

### Utility variables

| Variable | Description |
|---|---|
| `${date.get('yyyyMMdd')}` | Current date/time formatted with a Java `SimpleDateFormat` pattern |
| `${DATE}` | Current timestamp formatted as `dd-MM-yy_HH-mm-ss.SS` |
| `${COUNT}` | A counter that goes up by one each time it is referenced. It belongs to the connector doing the replacement, starts at 1, and starts again after a redeploy |
| `${UUID}` | A random UUID string |
| `${SYSTIME}` | Current system time in milliseconds |
| `${HASH}` | SHA-256 hash of the encoded message content (falls back to raw if encoded is unavailable) |
| `${originalFilename}` | Original filename from the source connector (defaults to `<timestamp>.dat` if unset) |
| `${XmlUtil}` | The `XmlUtil` script class, for static calls such as `${XmlUtil.encode($value)}` |
| `${JsonUtil}` | The `JsonUtil` script class, for static calls such as `${JsonUtil.escape($value)}` |
| `${maps.get('key')}` | The value of a key from the first loaded map that has it. Maps load from the configuration map toward the response map, so this returns the lowest-priority match |

### Date formatting examples

```text
${date.get('yyyyMMdd')}          → 20240101
${date.get('yyyy-MM-dd HH:mm')} → 2024-01-01 12:00
${date.get('yyyyMMddHHmmss')}   → 20240101120000
```

## Examples

Each example is a destination connector field, replaced for each message with that message's maps in the context. `message` and `date` are the built-in objects listed above. `patientId`, `patientLastName`, `patientFirstName` and `medicalRecordNumber` are keys a transformer step stored in the channel map.

**In a File Writer filename:**
```text
message_${message.messageId}_${date.get('yyyyMMdd')}.hl7
```

**In an HTTP Sender URL:**
```text
https://api.example.com/patients/${patientId}/records
```

**In a destination template:**
```text
Patient: ${patientLastName}, ${patientFirstName}
MRN: ${medicalRecordNumber}
```

## Conditional statements

Velocity supports `#if` / `#else` / `#elseif` / `#end` for conditional logic within templates. `gender` here is a channel map key stored by a transformer step. A key that is in none of the maps compares as not equal, so the `#else` branch is taken and no error is raised:

```text
#if(${gender} == "M")
Male
#elseif(${gender} == "F")
Female
#else
Unknown
#end
```

## For loops

Velocity supports `#foreach` loops for iterating over collections. `itemList` must be a collection a transformer step stored in a map: a JavaScript array and a `java.util.List` both iterate. If the key is missing, or its value is not a collection (a string, for example), the loop produces no output and no error. `${item}` and `$item` are the same reference; the braces only mark where the name ends:

```text
#foreach(${item} in ${itemList})
Item: ${item}
#end
```

## Where Velocity is used

| Location | Example |
|---|---|
| **Destination templates** | Message body content |
| **File Writer directory/filename** | `/output/${channelName}/${date.get('yyyyMMdd')}/` |
| **HTTP Sender URL** | `https://host/api/${patientId}` |
| **HTTP headers/parameters** | Header values with dynamic content |
| **Email subject/body** | SMTP sender fields |
| **Database Reader and Writer SQL** | Each `${}` becomes a `?` bound as a JDBC parameter, not text. Write `${patientId}`, not `'${patientId}'`, and a `${}` cannot supply a table or column name. A `${}` that matches nothing is bound as the text `${name}` itself |
| **Alert templates** | Alert notification content |

In the Database Reader the select runs before any message exists, so its values come from the utility variables and the global channel, global and configuration maps. The post-process statement also sees the row's columns, as `${column_name}`, and the processed message when there is one.

## Velocity vs. JavaScript

How the two compare:

| Aspect | Velocity `${}` | JavaScript |
|---|---|---|
| **Syntax** | `${varName}` | `channelMap.get('varName')` |
| **Where** | Template fields, filenames, URLs | Transformer/filter steps, scripts |
| **Conditionals** | `#if/#else/#end` | `if/else` |
| **Loops** | `#foreach` | `for`, `while` |
