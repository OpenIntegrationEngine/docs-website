---
title: Data Types and Formats
description: Supported healthcare standards and data formats
---

# Data Types and Formats

Data types control how OIE interprets incoming data and produces outgoing data. On the inbound side, the engine uses the data type to **serialize** raw content into an internal representation (typically XML) that filters and transformers can work with. On the outbound side, it uses the data type to **deserialize** the modified internal representation back into a concrete output format.

## How data types work

The properties available for a given data type depend on two factors: whether it is being used as inbound or outbound, and whether it is attached to a source connector, a destination connector, or a destination's response. The property groups that may appear are:

### Inbound properties

- **Serialization Properties**. Configure how raw data is converted into the internal format. Some data types (like DICOM and JSON) have no serialization settings. The Raw data type skips serialization entirely.
- **Batch Properties**. Define how to divide a single inbound payload into multiple messages. Only relevant when Process Batch is turned on in the source settings, and not every data type supports batching.
- **Response Generation Properties**. Control how automatic responses (such as HL7 ACKs) are constructed. Only HL7 v2.x has them. They appear on the source connector's inbound data type and take effect only when the source's **Response** setting is one of the Auto-generate options.
- **Response Validation Properties**. Define how to evaluate the responses a destination gets back. Only HL7 v2.x has them. They appear on a destination's response inbound data type and take effect only when **Validate Response** is on for that destination.

### Outbound properties

- **Deserialization Properties**. Configure how data is converted from the internal format back into the target output format. Some data types (DICOM, EDI/X12, HL7 v3.x, JSON, XML) need no configuration here, and Raw performs no conversion at all.
- **Template Serialization**. When an outbound template is defined for a transformer, these settings control how that template is serialized into the internal format.

## Supported data types

| Data Type | Description |
|---|---|
| **Delimited Text** | Handles CSV, TSV, fixed-width, and other custom-delimited formats with configurable separators |
| **DICOM** | For medical imaging data. The engine converts between binary DICOM and an XML representation. There are no serialization settings. |
| **EDI / X12** | Supports UN/EDIFACT, ASC X12, and similar formats built around segment, element, and subelement delimiters |
| **HL7 v2.x** | The standard pipe-delimited HL7 Version 2 format. Has strict and non-strict parser settings, auto-generated ACKs, response validation, and MSH-based batch splitting. |
| **HL7 v3.x** | XML-based HL7 Version 3. The wire format is already XML, so the engine does not convert it. Includes an option to remove namespace declarations. |
| **JSON** | JavaScript Object Notation. The `msg` and `tmp` variables become native JavaScript objects instead of E4X XML. There are no serialization settings. |
| **NCPDP Telecom** | Pharmacy data in the National Council for Prescription Drug Programs format. Uses configurable field, group, and segment delimiters. |
| **Raw** | A pass-through data type for arbitrary content. `msg` is a JavaScript String object and `tmp` is the template text. No conversion is performed in either direction. |
| **XML** | Generic XML. The wire format is already XML, so the engine does not convert it. Has a namespace-stripping option. |

## Internal representation

Different data types use different object types internally:

- **HL7 v2.x, HL7 v3.x, XML, EDI/X12, NCPDP, Delimited Text, DICOM**. The `msg` and `tmp` variables are E4X XML objects. You access fields using bracket notation like `msg['MSH']['MSH.9']['MSH.9.1']`.
- **JSON**. The variables are standard JavaScript objects. Field access uses standard dot or bracket notation.
- **Raw**. `msg` is a JavaScript String object and `tmp` is the template as a JavaScript string. You work with them using string operations.

## Setting data types

Each connector has separate inbound and outbound data type settings, accessible through the **Set Data Types** window on the channel's Summary tab.

A connector's inbound and outbound types can differ. For example:
- **Source inbound**: HL7 v2.x (received from a clinical system)
- **Source outbound**: XML (intermediate format)
- **Destination inbound**: XML
- **Destination outbound**: JSON (delivered to a REST API)

HL7 v2.x is converted to XML automatically when the outbound type is XML. Selecting JSON as the outbound type does not convert XML or HL7 v2.x to JSON: a transformer step has to build the object, for example by assigning an object to `msg`.

## Data type properties

### HL7 v2.x properties

**Serialization / Template Serialization:**

| Property | Default | Description |
|---|---|---|
| Parse Field Repetitions | Enabled | Handle field repetitions (non-strict parser only) |
| Parse Subcomponents | Enabled | Handle subcomponents (non-strict parser only) |
| Use Strict Parser | Disabled | Use the HL7 specification-based parser instead of the simplified non-strict parser |
| Validate in Strict Parser | Disabled | Enforce HL7 specification rules during parsing (strict parser only) |
| Strip Namespaces | Disabled | Remove namespace declarations from the XML output (strict parser only) |
| Segment Delimiter | `\r` | Character(s) expected between segments in the raw message |
| Convert Line Breaks | Enabled | Normalize all line break styles (CRLF, CR, LF) to the configured segment delimiter |

**Deserialization:**

| Property | Default | Description |
|---|---|---|
| Use Strict Parser | Disabled | Use the HL7 specification-based parser |
| Validate in Strict Parser | Disabled | Enforce HL7 specification rules during parsing (strict parser only) |
| Segment Delimiter | `\r` | Delimiter character(s) placed after each segment in the output |

**Response Generation:**

| Property | Default | Description |
|---|---|---|
| Segment Delimiter | `\r` | Delimiter character(s) used after each segment in the generated ACK |
| Successful ACK Code | AA | Code placed in the ACK when processing succeeds |
| Successful ACK Message | *(empty)* | Message text placed in the ACK when processing succeeds |
| Error ACK Code | AE | Code placed in the ACK when an error occurs |
| Error ACK Message | An Error Occurred Processing Message. | Message text placed in the ACK when an error occurs |
| Rejected ACK Code | AR | Code placed in the ACK when the message is filtered |
| Rejected ACK Message | Message Rejected. | Message text placed in the ACK when the message is filtered |
| MSH-15 ACK Accept | Disabled | Check MSH-15 to control whether/when to acknowledge |
| Date Format | yyyyMMddHHmmss.SSS | Format string for timestamps in generated ACKs |

**Response Validation:**

| Property | Default | Description |
|---|---|---|
| Successful ACK Codes | AA,CA | Codes in a response that indicate acceptance (message marked SENT) |
| Error ACK Codes | AE,CE | Codes that indicate an error on the receiving end (message marked ERROR) |
| Rejected ACK Codes | AR,CR | Codes that indicate rejection (message marked ERROR) |
| Validate Message Control Id | Enabled | Confirm that MSA-2 in the response matches the original message control ID |
| Original Message Control Id | Destination Encoded | Source of the original message control ID for validation. Choose Destination Encoded (from MSH-10 of destination encoded content) or Map Variable. |
| Original Id Map Variable | *(empty)* | Variable name in the connector map or channel map to read the original message control ID from (only used when Original Message Control Id is set to Map Variable) |

### Delimited text properties

**Serialization / Template Serialization:**

| Property | Default | Description |
|---|---|---|
| Column Delimiter | `,` | Separator between columns |
| Record Delimiter | `\n` | Separator between records |
| Column Widths | | Comma-separated fixed widths (leave blank for delimiter-based parsing) |
| Quote Token | `"` | Character(s) used to wrap column values that contain special characters |
| Double Quote Escaping | Enabled | Treat two consecutive quote tokens as an embedded quote. Disable to use the Escape Token instead. |
| Escape Token | `\` | Character(s) used to escape quote tokens (only takes effect when Double Quote Escaping is disabled) |
| Column Names | | Comma-separated custom names (defaults to column1, column2, etc.) |
| Numbered Rows | Disabled | Number each row in the XML representation |
| Ignore Carriage Returns | Enabled | Skip over carriage return (`\r`) characters without processing them |

**Deserialization:**

| Property | Default | Description |
|---|---|---|
| Column Delimiter | `,` | Separator between columns |
| Record Delimiter | `\n` | Separator between records |
| Column Widths | | Comma-separated fixed widths (leave blank for delimiter-based parsing) |
| Quote Token | `"` | Character(s) used to wrap column values that contain special characters |
| Double Quote Escaping | Enabled | Treat two consecutive quote tokens as an embedded quote. Disable to use the Escape Token instead. |
| Escape Token | `\` | Character(s) used to escape quote tokens (only takes effect when Double Quote Escaping is disabled) |

### EDI / X12 properties

**Serialization / Template Serialization:**

| Property | Default | Description |
|---|---|---|
| Segment Delimiter | `~` | Separator between segments |
| Element Delimiter | `*` | Separator between elements |
| Subelement Delimiter | `:` | Separator between subelements |
| Infer X12 Delimiters | Enabled | For X12 messages, detect delimiters from the message itself rather than using the configured values |

### NCPDP properties

**Serialization / Template Serialization:**

| Property | Default | Description |
|---|---|---|
| Field Delimiter | 0x1C | Separator between fields |
| Group Delimiter | 0x1D | Separator between groups |
| Segment Delimiter | 0x1E | Separator between segments |

**Deserialization:**

| Property | Default | Description |
|---|---|---|
| Field Delimiter | 0x1C | Separator between fields |
| Group Delimiter | 0x1D | Separator between groups |
| Segment Delimiter | 0x1E | Separator between segments |
| Use Strict Validation | Disabled | Check the message against the NCPDP schema. In 4.7.0 it has no effect: the message is transformed the same with it on or off, and with it on the server log reports that it cannot find the schema document `/ncpdpD0.xsd` |

### XML properties

**Serialization / Template Serialization:**

| Property | Default | Description |
|---|---|---|
| Strip Namespaces | Disabled | Remove namespace declarations from the XML |

### HL7 v3.x properties

**Serialization / Template Serialization:**

| Property | Default | Description |
|---|---|---|
| Strip Namespaces | Disabled | Remove namespace declarations from the XML |

## Batch processing by data type

Each data type offers different methods for splitting inbound data when Process Batch is enabled:

| Data Type | Batch Split Options |
|---|---|
| **Delimited Text** | Record, Delimiter, Grouping Column, JavaScript |
| **EDI / X12** | JavaScript only |
| **HL7 v2.x** | MSH Segment, JavaScript |
| **HL7 v3.x** | JavaScript only |
| **JSON** | JavaScript only |
| **NCPDP Telecom** | JavaScript only |
| **Raw** | JavaScript only |
| **XML** | Element Name, Level, XPath Query, JavaScript |

Every data type except DICOM supports a **JavaScript batch script** option. Within the script, you have access to a `reader` variable, a Java BufferedReader connected to the inbound data stream. Your script reads from it and returns a String for each message. Return null or an empty string to signal that no more messages remain.
