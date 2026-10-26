---
title: Command Line Interface
description: CLI commands and scripting
---

# Command Line Interface

The OIE CLI is a terminal-based interface for managing the server. It connects over the same REST API as the desktop and web administrators.

## Configuration

The CLI configuration file is located at:
```text
OIE_HOME/conf/mirth-cli-config.properties
```

Default contents:
```properties
address=https://127.0.0.1:8443
user=admin
password=admin
version=0.0.0
```

These are not the credentials of a new database, whose `admin` password is generated at first start, so set `user` and `password` to the account the CLI logs in as, or pass `-u` and `-p`. See [Initial admin password](./accessing_the_administrator.md#initial-admin-password).

The CLI reads `address`, `user`, and `password` from this file, plus an optional `script` key (see [Scripting](#scripting)). The `version` line is never read, and neither is the `-v` flag.

### Environment variable substitution

As of 4.6.0 the config file is read through Apache Commons Configuration2, which performs variable interpolation. Environment variables can be referenced with `${env:VARIABLE_NAME}`:

```properties
address=${env:OIE_SERVER_URL}
user=${env:OIE_USER}
password=${env:OIE_PASSWORD}
```

With these references the file holds no credentials; without them, the CLI config stores the password in plain text.

An unset variable is not an error. The literal `${env:OIE_SERVER_URL}` text becomes the value, and the CLI fails when it tries to connect or log in with it, not when it loads the file.

::: info
If you point at a config file explicitly with `-c` and it cannot be loaded, the CLI reports the failure and exits with status 2. If you rely on the default path and that file cannot be loaded, the CLI continues silently, and you will only find out when it reports that address, user, password, and version must be supplied. Only the first three matter.
:::

## Launching the CLI

Run the launcher from the installation directory. It builds its classpath from `cli-lib/` and the shared libraries under `extensions/`, and the CLI looks for `conf/mirth-cli-config.properties`, all relative to the working directory.

```bash
cd <installation directory>

# Address, user, and password come from the config file
java -jar mirth-cli-launcher.jar

# Command-line options override the config file
java -jar mirth-cli-launcher.jar -a https://host:8443 -u <username>
```

`-p` overrides the password the same way. Anything not given on the command line is taken from the config file.

### Command-line options
| Flag | Description |
|---|---|
| `-a <address>` | Server address (e.g., `https://localhost:8443`) |
| `-u <user>` | Username |
| `-p <password>` | Password |
| `-s <script>` | Execute a script file and exit |
| `-v <version>` | Accepted but never read |
| `-c <config file>` | Path to CLI config file (default: `conf/mirth-cli-config.properties`, relative to the working directory) |
| `-h` | Show help |
| `-d` | Enable debug mode (prints stack traces on errors) |

## Commands reference

### Channel status and control

```text
status
    Returns status of all deployed channels

channel list
    Lists all channels

channel start id|"name"|*
    Starts stopped channels and resumes paused ones

channel stop id|"name"|*
    Stops specified channel(s)

channel halt id|"name"|*
    Force-stops specified channel(s) immediately

channel pause id|"name"|*
    Pauses specified channel(s)

channel resume id|"name"|*
    Resumes paused channel(s)

channel deploy id|"name"|*
    Deploys specified channel(s)

channel undeploy id|"name"|*
    Undeploys specified channel(s)

channel stats id|"name"|*
    Shows statistics for specified channel(s)

channel stats
    Shows one line of statistics for every deployed channel

channel enable id|"name"|*
    Enables specified channel(s)

channel disable id|"name"|*
    Disables specified channel(s)

channel rename id|"name" newname
    Renames specified channel

channel remove id|"name"|*
    Removes specified channel(s)
```

Use `*` to target all channels.

### Deploy

```text
deploy [timeout]
    Redeploys all channels: every deployed channel is undeployed,
    the global map is cleared, then every enabled channel is deployed.
    The CLI then polls every half second, up to timeout seconds
    (default 30), until at least one channel reports a status
```

The global map is cleared unless the server setting "Clear global map on redeploy" is set to No. The redeploy call returns only after the deploy has finished, so `timeout` does not limit how long the deploy takes. With no enabled channel the CLI prints `No Channels to Deploy` and does not poll.

### Import / export channels

```text
import "path" [force]
    Imports a channel from file. 'force' overwrites a channel with
    the same id or name. Without it, a colliding id or name is
    replaced with a generated id and the file is imported as a new channel.

export id|"name"|* "path"
    Exports a channel to the file at path.
    With *, path is a filename prefix: each channel is written to
    <path><channel name>.xml with nothing added in between, so end
    it with a slash to write into a directory, e.g. export * "/backups/"
```

### Import / export server configuration

```text
importcfg "path" [nodeploy] [overwriteconfigmap]
    Imports full server configuration.
    'nodeploy' prevents auto-deployment.
    'overwriteconfigmap' replaces the Configuration Map.

exportcfg "path"
    Exports full server configuration to file
```

### Alerts

```text
importalert "path" [force]
    Imports the alerts in the file. 'force' overwrites an alert with
    the same name. Without it, a colliding name is replaced with a
    generated id and the alert is imported as a new one.

exportalert id|"name"|* "path"
    Exports an alert to the file at path.
    With *, path is a filename prefix and each alert is written to
    <path><alert name>.xml, so end it with a slash
```

### Scripts

```text
importscripts "path"
    Imports global scripts from file

exportscripts "path"
    Exports global scripts to file
```

### Code templates

```text
codetemplate library list [includecodetemplates]
    Lists all code template libraries.
    'includecodetemplates' shows templates within each library.

codetemplate list
    Lists all code templates

codetemplate import "path" [force]
    Imports code templates from file

codetemplate library import "path" [force]
    Imports code template libraries from file

codetemplate export id|"name" "path"
    Exports a code template to file

codetemplate library export id|"name"|* "path"
    Exports the matched libraries, with their code templates, to one file

codetemplate remove id|"name"
    Removes a code template

codetemplate library remove id|"name"|*
    Removes code template library(ies)
```

### Messages

```text
importmessages "path" id
    Imports messages into the channel with the given id from a file,
    or from every file under a directory

exportmessages "path/file-pattern" id [format] [pageSize]
    Exports every message of the channel with the given id.
    The file name may use message variables such as ${message.messageId}
    to write one file per message. A fixed name appends every message
    to that one file.
    format xml (the default) writes the full message XML. xml-attach adds
    the attachments. The other formats write one content of each message's
    source connector: raw, processedraw, transformed, encoded, response.
    sent, responsetransformed, and processedresponse exist only on
    destination connectors and export nothing from the CLI.
    pageSize (default 100) is how many messages are fetched per request
    and is read only when format is also given, so give xml explicitly
    to set it
```

::: danger Broken in 4.7.0
`exportmessages` fails with `NoClassDefFoundError: org/apache/log4j/Level`, writes nothing, and exits with status 0. Fixed by [engine PR #539](https://github.com/OpenIntegrationEngine/engine/pull/539), not yet in a release.
:::

### Configuration map

```text
importmap "path"
    Imports configuration map from file

exportmap "path"
    Exports configuration map to file
```

### Statistics and events

```text
resetstats [lifetime]
    Resets the current statistics of every deployed channel.
    'lifetime' resets current and lifetime statistics for every channel
    in the database, deployed or not.

clearallmessages
    Removes all messages from all channels. Running channels are
    stopped and restarted. Statistics are kept.

dump stats "path"
    Writes channel statistics to the file

dump events "path"
    Writes the event log to the file
```

On the default Derby database with several channels, `clearallmessages` leaves one channel's messages in place and that channel stopped, and the server log shows a deadlock. Statistics are kept. Other databases have not been tested.

In both dump commands `${date}` in the path is replaced with a timestamp in the form `dd-MM-yy_HH-mm-ss.SS`.

### User management

```text
user list
    Lists all users

user add username "password" "firstName" "lastName" "organization" "email"
    Creates a new user

user remove id|username
    Removes a user

user changepw id|username "newpassword"
    Changes a user's password
```

### Session

```text
help
    Lists the commands with a one-line description of each

quit
    Exits the CLI shell
```

## Scripting

The CLI can execute commands from a script file, one command per line. Anything after an unquoted `#` is a comment. The path can also be set with a `script` key in the config file. Run it from the installation directory, like the interactive shell:

```bash
java -jar mirth-cli-launcher.jar -s /path/to/script.txt
```

### Script file example
```text
deploy
channel start *
status
exportcfg "/backups/config_backup.xml"
quit
```
