---
title: JavaScript Editor
description: The built-in code editor features and shortcuts
---

# JavaScript Editor

The JavaScript Editor is the desktop Administrator's code editor for filter rules, transformer steps, channel scripts, and code templates.

::: tip The Web Administrator's script editor
The [Web Administrator](./web_administrator.md) edits scripts in the Monaco editor. It completes object members as you type, offers the channel's own code template functions as completions, and is bundled with the web client, so it works without internet access. For writing scripts it is a far better experience than the desktop editor this page describes.
:::

## Features

### Syntax highlighting
The editor provides color-coded syntax highlighting for JavaScript, including OIE-specific keywords and variables such as `msg`, `tmp`, `connectorMap`, `channelMap`, `logger`, `FileUtil`, `DateUtil`, and map shorthand functions (`$c`, `$g`, `$s`, `$r`, etc.).

### Auto-completion
Press `Ctrl+Space` to open the auto-completion popup. It provides suggestions for:
- Built-in JavaScript functions and objects
- OIE utility classes and methods (`ChannelUtil`, `DateUtil`, `FileUtil`, `DatabaseConnectionFactory`, `SMTPConnectionFactory`, etc.)
- Variable map methods (`channelMap.put`, `globalMap.get`, etc.)
- Code template functions available in the current context

Auto-completion can also be triggered automatically after typing certain characters (`.` by default). These settings are configurable under Code Editor Preferences.

### Find and replace
`Ctrl+F` (`Cmd+F` on macOS) opens the Find / Replace dialog:
- **Find text** / **Replace with**: Search and replace fields with history dropdowns
- **Direction**: Forward or Backward
- **Wrap Search**: Search wraps around the end of the file
- **Match Case**: Toggle case sensitivity
- **Regular Expression**: Use regular expressions for search patterns
- **Whole Word**: Match whole words only

### Code folding
Collapse and expand code blocks:
- Click the fold icons in the gutter (left margin)
- Collapse functions, if/else blocks, loops, and other block structures
- Use the Folding submenu in the context menu or keyboard shortcuts to collapse/expand folds

## Context menu

Right-click in the editor to access:

| Option | Description |
|---|---|
| **Undo / Redo** | Undo/redo recent changes |
| **Cut / Copy / Paste / Delete** | Standard clipboard operations |
| **Select All** | Select all code in the editor |
| **Find/Replace** | Open the find/replace dialog |
| **Find Next** | Find the next occurrence |
| **Clear Marked Occurrences** | Clear highlighted search results |
| **Folding** | Submenu: Collapse Current Fold, Expand Current Fold, Collapse All Folds, Collapse Comment Folds, Expand All Folds |
| **Display** | Submenu: Show Tab Lines, Show Whitespace, Show Line Endings, Wrap Lines |
| **Code** | Submenu: Format, Toggle Comment |
| **Macro** | Submenu: Begin Recording Macro, End Recording Macro, Playback Recorded Macro |
| **View User API** | Open the User API documentation |

## Keyboard shortcuts

Default shortcuts. On macOS most of them use Cmd where Windows and Linux use Ctrl:

| Windows and Linux | macOS | Action |
|---|---|---|
| `Ctrl+Space` | `Ctrl+Space` | Open auto-completion popup |
| `Ctrl+F` | `Cmd+F` | Find and Replace |
| `Ctrl+G` | `Cmd+G` | Find Next |
| `Ctrl+Z` | `Cmd+Z` | Undo |
| `Ctrl+Y` | `Cmd+Shift+Z` | Redo |
| `Ctrl+/` | `Cmd+/` | Toggle line comment |
| `Ctrl+Shift+F` | `Ctrl+Shift+F` | Format code |
| `Ctrl+D` | `Cmd+D` | Delete line |
| `Ctrl+J` | `Cmd+J` | Join lines |
| `Ctrl+[` | `Cmd+[` | Go to matching bracket |
| `Ctrl+A` | `Cmd+A` | Select all |
| `Ctrl` + numeric keypad minus | `Cmd` + numeric keypad minus | Collapse current fold |
| `Ctrl` + numeric keypad plus | `Cmd` + numeric keypad plus | Expand current fold |
| `Ctrl` + numeric keypad divide | `Cmd` + numeric keypad divide | Collapse all folds |
| `Ctrl+Shift` + numeric keypad divide | `Cmd+Shift` + numeric keypad divide | Collapse comment folds |
| `Ctrl` + numeric keypad multiply | `Cmd` + numeric keypad multiply | Expand all folds |
| `Tab` | `Tab` | Indent selected lines |
| `Shift+Tab` | `Shift+Tab` | Unindent selected lines |

The fold shortcuts use the keys on the numeric keypad, not the minus and plus keys on the main keyboard, so a keyboard without a numeric keypad needs them remapped. Every shortcut above except `Tab` and `Shift+Tab` can be remapped under **Settings > Administrator > Code Editor Preferences** using the Shortcut Key Mappings table.

## Reference list

The **Reference List** panel sits next to the script editor and lists functions, code snippets, and variables by category. Use the **Category** dropdown to filter by category and the **Filter** field to search within the selected category.

### Categories
The **Category** dropdown starts on **All**. A category appears only when it has items for the script you are editing, and **User Defined Code** and **User Defined Functions** appear only when code templates of that type apply to the current script.

The categories, with examples of what each holds:

- **Conversion Functions**: Get Serializer, Convert XML to JSON, Convert JSON to XML
- **Logging and Alerts**: log an info or error statement, send an email, trigger an alert
- **Database Functions**: database queries and updates, and the connection template and driver name for each bundled driver
- **Utility Functions**: reading and writing files, Base64, routing to another channel, attachments, hashing, DICOM images, pretty printing XML and JSON
- **Date Functions**: parsing, formatting and converting dates, and getting the current date
- **Message Functions**: the incoming message, raw or transformed, its type, version and IDs, iterating over and deleting segments, and removing destinations from the destination set
- **Response Transformer**: setting the response status to SENT, QUEUED or ERROR, and its status message and error message
- **Map Functions**: getting and putting values in each map, looking a key up in all maps, and creating a sent or error response
- **Channel Functions**: the channel ID and name
- **Postprocessor Functions**: the completed message and its merged, source and destination connector messages
- **User Defined Code**: User-created code templates (code type)
- **User Defined Functions**: User-created code templates (function type)

Rest the pointer on an item to see its description, then drag it into the editor to insert the code.

### Variables
Which variables appear depends on the current script context. Examples include:
- `msg` (inbound message in filter/transformer scripts), `tmp` (outbound template in filter/transformer scripts)
- `connectorMessage` (in connector scripts)
- `message` (completed message object in the postprocessor)
- `response`, `responseStatus`, `responseErrorMessage`, `responseStatusMessage` (in response transformer scripts)
- Map objects: `connectorMap`, `channelMap`, `sourceMap`, `globalChannelMap`, `globalMap`, `configurationMap`, `responseMap`
- `logger`, `router`, `alerts`, `replacer`, `contextFactory`

## Code editor preferences

Configure editor behavior in **Settings > Administrator > Code Editor Preferences**:

| Preference | Description |
|---|---|
| **Auto-Complete Characters** | Characters that trigger the auto-completion popup (default: `.`) |
| **Include Letters** | If enabled, auto-completion triggers after any letter is typed |
| **Activation Delay (ms)** | Time to wait after typing a trigger character before showing the popup (default: 300 ms) |
| **Shortcut Key Mappings** | Table of all remappable editor actions with their current keyboard shortcuts; double-click a shortcut to change it |
| **Restore Defaults** | Reset all shortcut key mappings to their defaults |

