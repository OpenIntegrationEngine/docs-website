---
title: Logging
description: Log configuration and troubleshooting
---

# Logging

OIE uses **Log4j 2** for server-side logging.

## Log files

Default log location: `OIE_HOME/logs/`

| File | Contents |
|---|---|
| `mirth.log` | Main server log (current) |
| `mirth.log.1.zip` to `mirth.log.20.zip` | Rotated log files, each a zip archive; the highest index is the newest |

## Configuration

The logging configuration file is:
```text
OIE_HOME/conf/log4j2.properties
```

### Default configuration

The root logger and appenders from the shipped `conf/log4j2.properties`. The logger entries that follow them in the same file are listed in the sections below.

```properties
# Root logger: ERROR level, outputs to console and file
rootLogger = ERROR,stdout,fout

# Directory both log file names are built from
property.log.dir = logs

# Console appender
appender.console.type = Console
appender.console.name = stdout
appender.console.layout.type = PatternLayout
appender.console.layout.pattern = %-5p %d{yyyy-MM-dd HH:mm:ss.SSS} [%t] %c: %m%n
appender.console.layout.charset = UTF-8

# File appender (rolling)
appender.rolling.type = RollingFile
appender.rolling.name = fout
appender.rolling.fileName = ${log.dir}/mirth.log
appender.rolling.filePattern = ${log.dir}/mirth.log.%i.zip
appender.rolling.policies.type = Policies
appender.rolling.policies.size.type = SizeBasedTriggeringPolicy
appender.rolling.policies.size.size = 500KB
appender.rolling.strategy.type = DefaultRolloverStrategy
appender.rolling.strategy.max = 20
appender.rolling.layout.type = PatternLayout
appender.rolling.layout.pattern = %-5p %d{yyyy-MM-dd HH:mm:ss.SSS} [%t] %c: %m%n
```

`property.log.dir` is relative to the working directory. The launcher opens `conf/`, `extensions/`, and `server-lib/` by the same relative paths, so that directory is `OIE_HOME`. Configuration files from earlier releases carried a `dir.logs` line that nothing reads; the launcher removes it before Log4j loads the file.

### Log rotation
- `mirth.log` rotates when it reaches **500 KB**
- Each rotated file is compressed to a zip archive. The index counts up, so the highest index is the newest and `mirth.log.1.zip` is the oldest
- Up to **20** archives are retained; the oldest is deleted when the limit is reached

To change the rotation size or the number of archives, edit these two properties. The server reads `log4j2.properties` when it starts and does not reload it while running.
```properties
# Rotate at 10 MB
appender.rolling.policies.size.size = 10MB

# Keep 50 archives
appender.rolling.strategy.max = 50
```

## Log levels

| Level | Description |
|---|---|
| `ERROR` | Errors that need attention |
| `WARN` | Warning conditions |
| `INFO` | Informational messages |
| `DEBUG` | Detailed debugging information |
| `TRACE` | Most verbose level |

The root logger is set to `ERROR` by default. The loggers listed below override this for specific components.

## Server loggers

Pre-configured server loggers:

```properties
# Server startup/shutdown
logger.mirth.name = com.mirth.connect.server.Mirth
logger.mirth.level = INFO

# Channel deployment
logger.donkeyEngineController.name = com.mirth.connect.server.controllers.DonkeyEngineController
logger.donkeyEngineController.level = INFO

# Message recovery
logger.recoveryTask.name = com.mirth.connect.donkey.server.channel.RecoveryTask
logger.recoveryTask.level = INFO

# File connector
logger.fileReceiver.name = com.mirth.connect.connectors.file.FileReceiver
logger.fileReceiver.level = WARN
```

## Channel script loggers

Each script type writes to a logger named after it, so `logger.*` calls in a channel deploy script appear under `deploy`. A connector's filter and transformer run as one generated script: `logger.*` calls in filter rules appear under `filter`, and calls in transformer steps appear under `transformer`. The shipped levels:

```properties
logger.transformer.name = transformer
logger.transformer.level = DEBUG

logger.preprocessor.name = preprocessor
logger.preprocessor.level = DEBUG

logger.postprocessor.name = postprocessor
logger.postprocessor.level = DEBUG

logger.deploy.name = deploy
logger.deploy.level = DEBUG

logger.undeploy.name = undeploy
logger.undeploy.level = DEBUG

logger.filter.name = filter
logger.filter.level = DEBUG

logger.db-connector.name = db-connector
logger.db-connector.level = DEBUG

logger.js-connector.name = js-connector
logger.js-connector.level = DEBUG

logger.attachment.name = attachment
logger.attachment.level = DEBUG

logger.batch.name = batch
logger.batch.level = DEBUG

logger.response.name = response
logger.response.level = DEBUG

logger.shutdown.name = shutdown
logger.shutdown.level = DEBUG
```

## Using the logger in scripts

The engine places `logger` in every script scope. `channelName` is absent from the global deploy and undeploy scripts, which have no channel. The sample below runs in the channel deploy script. A Java call that throws is caught as a JavaScript error whose `javaException` property holds the Java throwable; passed as the second argument, it is written after the message as a stack trace. Passing the JavaScript error itself writes the message alone.

```javascript
// Channel deploy script. logger and channelName come from the deploy scope.
logger.info(channelName + ': deployed');

try {
  java.lang.Class.forName('com.example.Driver');
} catch (e) {
  logger.error(channelName + ': JDBC driver is not on the classpath', e.javaException);
}
```

The script loggers ship at `DEBUG`, so `logger.debug` lines are written and `logger.trace` lines are not. A logger line goes to the server log, which rotates (see [Log rotation](#log-rotation)), so older lines are eventually deleted. The line names the script and the channel through its thread, for example `[Source Filter/Transformer JavaScript Task on ADT Inbound (<channel id>) < pool-1-thread-14]`, but not the message: it carries no message ID or message data unless the script writes them into the line. A value put in the channel map (`$c`) or the connector map (`$co`) is stored with the message instead, subject to the channel's storage mode, and the Message Browser shows it on that message's Mappings tab; the map shorthands are described in the [Script Scope and User API](./script_scope_and_user_api.md#maps).

### Logger output
Logger output appears in:
1. `logs/mirth.log` (file)
2. The server console (stdout)
3. The **Server Log** plugin panel in the Administrator

## Server Log plugin

The **Server Log** plugin is a real-time log viewer in the Administrator:
- View log entries as they are written
- Double-click an entry to view its full content
- Pause/resume log polling
- Clear the displayed log
- Configure the maximum number of displayed entries

## CLI log configuration

The CLI has its own log configuration:
```text
OIE_HOME/conf/log4j2-cli.properties
```

## SQL logging

To debug database queries, change the level of the `java.sql` logger. The shipped file already declares the pair at `ERROR`, so edit that line rather than adding a second one. A `#` starts a comment only at the start of a line; anything after the level on the same line becomes part of the value, Log4j cannot parse it as a level, and the logger silently stays at `ERROR`.
```properties
# Shipped as ERROR
logger.sql.name = java.sql
logger.sql.level = DEBUG
```

::: warning
SQL logging at DEBUG level is very verbose.
:::

## Increasing log verbosity

To log more for specific packages, add loggers like these to `conf/log4j2.properties` and restart the server:
```properties
# Debug all server controllers
logger.controllers.name = com.mirth.connect.server.controllers
logger.controllers.level = DEBUG

# Debug HTTP connector
logger.httpConnector.name = com.mirth.connect.connectors.http
logger.httpConnector.level = DEBUG
```
