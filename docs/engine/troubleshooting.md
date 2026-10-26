---
title: Troubleshooting
description: Symptoms and causes for a server that will not start, an Administrator that will not connect, channels that will not run, and the errors you are most likely to see
---

# Troubleshooting

## Server will not start

### Java not found

**Symptom:** an error about a missing Java runtime or an unsupported version.

Confirm the version with `java -version`; OIE 4.7.0 requires Java 17 or later.

If more than one runtime is installed, name the one to use with a line
`-jvm=<path to the Java home directory>` in `conf/custom.vmoptions`, or with the environment
variable `INSTALL4J_JAVA_HOME_OVERRIDE` set to the Java home directory. Without either, the
launcher searches for one, and `JAVA_HOME` is ignored whenever a `java` of version 17 or newer is on the `PATH`. See
[Choosing a Java](./server_process_management.md#choosing-a-java) for the search order.

In an install or archive, the `OIE_JAVA_PATH` environment variable is ignored, and a `-java-cmd`
line in `conf/custom.vmoptions` stops the server from starting with
`Unrecognized option: -java-cmd`. Remove the line.

SDKMAN users can run `sdk env install` in the source tree to pick up the version the project
declares.

### Port already in use

**Symptom:** `http.port port is already in use: 8080` or `https.port port is already in use: 8443` in the log on startup. The server does not serve, and in the archive install its process keeps running.

Find the process holding the port (`lsof -i :8443` on Linux and macOS, `netstat -ano | findstr 8443` on Windows), then stop it or move OIE. The ports live in `conf/mirth.properties`:

```properties
http.port = 8080
https.port = 8443
```

### Database connection failed

**Symptom:** `Error establishing connection to database, retrying startup in <n> milliseconds`,
followed by `Error establishing connection to database, aborting startup.` once the retries run out.

Check that the database is running and reachable through any firewall between it and OIE, then confirm `database`, `database.url`, `database.username`, and `database.password` in `mirth.properties`. The account needs rights to create and alter tables on first start, not just to read and write. `database.connection.maxretry` and `database.connection.retrywaitinmilliseconds` control how hard the server tries before giving up.

### Out of memory

**Symptom:** `OutOfMemoryError` in the log.

Raise the heap in `conf/custom.vmoptions`:

```
-Xmx1024m
```

If that only delays the failure, the cause is usually retained state rather than heap size: a global or global channel map that grows per message and is never cleared, or a channel loading an unbounded result set. The global map holds its memory until the server restarts, or until a **Redeploy All** clears it when the server setting **Clear global map on redeploy** asks for it. A global channel map is cleared when its channel is undeployed and deployed again, if the channel's **Clear global channel map on deploy** setting is on.

## Administrator cannot connect

### Connection refused

Verify the server is running and that port 8443 is reachable. Check `https.host` in `mirth.properties`: set to `127.0.0.1` it accepts local connections only, which looks identical to a firewall problem from another machine.

### Certificate errors

The certificate generated on first start is signed by the engine's own generated certificate authority, which clients do not trust, so browsers and the desktop Administrator will warn. For production, install a CA-signed certificate into the keystore. If the handshake fails outright rather than warning, compare `https.server.protocols` and `https.ciphersuites` against what the client offers.

### Login fails

On a new database the `admin` password is generated at first start, not `admin`; see [Initial admin password](./accessing_the_administrator.md#initial-admin-password). Otherwise confirm the credentials, then check whether the account is locked after exceeding `password.retrylimit`, or whether the password has expired under `password.expiration`. See [Password policy](./user_management.md#password-policy) for both. Reset from the CLI with `user changepw admin "a-new-password-here"`; the new password must meet the same policy.

## Channel issues

### Channel will not start

Check the Server Log tab on the Dashboard first; a channel that refuses to start almost always logged why. The usual causes are a source connector port already in use, a channel dependency that failed to start in the same start request, an exception thrown from a deploy script, or, for a Database Reader or a File Reader over SFTP or FTP, an unreachable external resource.

### Messages not being received

Confirm the sending system is pointing at the right host and port and that nothing between them is blocking it. For TCP and MLLP, a mismatched transmission mode presents as a connection that opens and then goes quiet. For File Reader, check the directory and the filename filter. For Database Reader, run the query by hand against the same account. The Connection Log tab on the Dashboard shows connection events as they happen.

### Messages stuck in queue

Open the destination's failures in the Message Browser and read the error rather than the count. Common causes are an unreachable destination, an authentication failure that retries forever, and a retry interval long enough that the queue looks stalled when it is only slow. Queue settings are per destination.

### Transformer errors

Open the message in the Message Browser and read the Errors tab. `TypeError` usually means a method was called on the empty value that a field path not in this message returns (reading the missing path alone raises no error), `ReferenceError` an undefined variable, most often `tmp` in a transformer with no outbound template configured. Load a real sample message in the transformer editor and check the path against the actual structure rather than the specification.

To capture what a script saw for a specific message, put it in the channel map rather than the log. It then appears on that message's Mappings tab in the Message Browser, attached to the message it describes:

```javascript
$c('debugMessageType', msg['MSH']['MSH.9']['MSH.9.1'].toString());
```

### Filter not working

Check rule order and the AND/OR operators between rules, and confirm field paths against a real message. In a JavaScript filter, `return true` accepts the message and `return false` rejects it. A filter shares its scope with the transformer on the same connector, so a value the filter writes to `msg`, or to `tmp` where an outbound template exists, is still there when the transformer runs.

## Performance

### High CPU

Look for high-volume channels with expensive transformers, polling sources set to poll far more often than the data arrives, and loops in scripts over repeating segments that rescan the message each iteration. Raising processing threads helps only where message order does not matter.

### High memory

Check for large messages that would be better handled as attachments. Review global and global channel map usage: anything put in the global map stays until the server restarts, something removes it, or a **Redeploy All** clears it when the server setting **Clear global map on redeploy** asks for it. A global channel map is cleared when its channel is undeployed and deployed again, if the channel's **Clear global channel map on deploy** setting is on.

### Slow database

Where a read replica exists, point the read-only connection pool at it with the `database-readonly.*` properties (see [Database Support](./database_support.md)), keep statistics and indexes current, and raise `database.max-connections` if the pool is saturated. Configure pruning before tuning anything else.

## Common error messages

| Error | Cause | Where to look |
|---|---|---|
| `Address already in use` | Port conflict | Change the port or stop the conflicting process |
| `Error establishing connection to database` | Database unreachable or credentials wrong | `database.*` settings and network path |
| `OutOfMemoryError` | Heap exhausted, or retained state | `-Xmx`, then map growth |
| `SSLHandshakeException` | No protocol or cipher in common | `https.server.protocols` for connections to the engine, `https.client.protocols` for connections a connector makes, and `https.ciphersuites` |
| `ConnectException: Connection refused` | Destination unreachable | Host, port, firewall |
| `SocketTimeoutException` | Network or downstream timeout | Connector timeout settings |
| `ScriptCompileException` | JavaScript syntax error in a deploy or undeploy script | The deploy and undeploy scripts of the channel id named in the message |
| `MirthJavascriptTransformerException` | Runtime error in a filter or transformer script | Errors tab in the Message Browser |

## Getting help

- **Logs:** `logs/mirth.log` on the server
- **Events:** system events for operational issues
- **Discord:** [join the community](https://discord.gg/azdehW2Zrx)
- **GitHub Issues:** [report a bug](https://github.com/OpenIntegrationEngine/engine/issues)
- **Security issues:** the Eclipse Foundation Security Team, security@eclipse-foundation.org ([process](https://www.eclipse.org/security/))
