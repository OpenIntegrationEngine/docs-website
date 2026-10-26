---
title: Configuration Properties Reference
description: Properties accepted in mirth.properties
---

# Configuration Properties Reference

## Directories

| Property | Default | Description |
|---|---|---|
| `dir.appdata` | `appdata` | Application data directory |
| `dir.tempdata` | `${dir.appdata}/temp` | Temporary data directory |

## Network ports

| Property | Default | Description |
|---|---|---|
| `http.port` | `8080` | HTTP port (status page, `webstart.jnlp` and the signed client jars) |
| `https.port` | `8443` | HTTPS port (REST API, Administrator) |
| `http.host` | `0.0.0.0` | HTTP bind address |
| `https.host` | `0.0.0.0` | HTTPS bind address |
| `http.contextpath` | `/` | Web server context path |

## TLS / SSL

| Property | Default | Description |
|---|---|---|
| `https.client.protocols` | `TLSv1.3,TLSv1.2` | Client TLS protocol versions |
| `https.server.protocols` | `TLSv1.3,TLSv1.2,SSLv2Hello` | Server TLS protocol versions |
| `https.ciphersuites` | (the list in the shipped file) | Comma-separated cipher suites |
| `https.ephemeraldhkeysize` | `2048` | Ephemeral DH key size |

## Keystore

| Property | Default | Description |
|---|---|---|
| `keystore.path` | `${dir.appdata}/keystore.jks` | Keystore file path |
| `keystore.storepass` | `81uWxplDtB` | Keystore password. Replaced with a generated value on first start, when no keystore file exists and both passwords still have the shipped value |
| `keystore.keypass` | `81uWxplDtB` | Key password. Replaced the same way as `keystore.storepass` |
| `keystore.type` | `JCEKS` | Keystore type |

## Database

| Property | Default | Description |
|---|---|---|
| `database` | `derby` | Database type: `derby`, `mysql`, `postgres`, `oracle`, `sqlserver` |
| `database.url` | (Derby embedded) | JDBC connection URL |
| `database.driver` | (none) | JDBC driver class override (e.g. `com.microsoft.sqlserver.jdbc.SQLServerDriver`) |
| `database.username` | (empty) | Database username |
| `database.password` | (empty) | Database password |
| `database.max-connections` | `20` | Read/write connection pool size |
| `database-readonly.max-connections` | `20` | Read-only connection pool size. When the key is absent, the server writes `database-readonly.max-connections = 20` into the file at first start |
| `database.enable-read-write-split` | `true` | Enable separate read-only pool. When the key is absent, the split is on and the server writes `database.enable-read-write-split = true` into the file at first start |
| `database.pool` | `HikariCP` | Connection pool type: `HikariCP` or `DBCP` |
| `database.write-pool-cache` | `false` | Use the read/write pool for internal caches instead of the read-only pool |
| `database.connection.maxretry` | `2` | Startup connection retry attempts |
| `database.connection.retrywaitinmilliseconds` | `10000` | Wait between retries (ms) |

### Read-only pool override
| Property | Default | Description |
|---|---|---|
| `database-readonly` | (same as primary) | Read-only database type |
| `database-readonly.pool` | (same as primary) | Read-only pool type |
| `database-readonly.url` | (same as primary) | Read-only JDBC URL |
| `database-readonly.driver` | (same as primary) | Read-only JDBC driver class override |
| `database-readonly.username` | (same as primary) | Read-only username |
| `database-readonly.password` | (same as primary) | Read-only password |

## Password policy

| Property | Default | Description |
|---|---|---|
| `password.minlength` | `15` | Minimum password length |
| `password.minupper` | `0` | Minimum uppercase characters |
| `password.minlower` | `0` | Minimum lowercase characters |
| `password.minnumeric` | `0` | Minimum numeric characters |
| `password.minspecial` | `0` | Minimum special characters |
| `password.retrylimit` | `100` | Failed attempts before lockout (0 = no lockout) |
| `password.lockoutperiod` | `1` | Lockout duration in hours (0 = no lockout, even when `password.retrylimit` is set) |
| `password.expiration` | `0` | Days until expiration (0 = never) |
| `password.graceperiod` | `0` | Days a user may still log in after the password expires (0 = unlimited, -1 = no grace period) |
| `password.reuseperiod` | `0` | Days before a previous password may be reused (0 = always allow, -1 = never) |
| `password.reuselimit` | `0` | Times a previous password may be reused (0 = no limit, -1 = never) |

These are the values `conf/mirth.properties` ships with. A `password.*` key that is absent from the file is read as `0`, so deleting `password.minlength`, `password.retrylimit` or `password.lockoutperiod` turns that rule off.

## Server behavior

| Property | Default | Description |
|---|---|---|
| `server.startupdeploy` | `true` | Auto-deploy channels on startup |
| `server.includecustomlib` | `false` | Include custom-lib/ on classpath |
| `server.url` | (empty) | Server URL (auto-detected if empty) |
| `server.initialadminpassword` | (empty) | Password for the `admin` user, applied only when the database is first created. When blank, a random password is generated and written to the log once. See [Initial admin password](./accessing_the_administrator.md#initial-admin-password) |
| `server.id.ephemeral` | `false` | Generate a new server ID on every startup |

## API security

| Property | Default | Description |
|---|---|---|
| `server.api.require-requested-with` | `true` | Require X-Requested-With header (protects against CSRF) |
| `server.api.accesscontrolalloworigin` | `*` | CORS allowed origins |
| `server.api.accesscontrolallowcredentials` | `false` | CORS allow credentials |
| `server.api.accesscontrolallowmethods` | `GET, POST, DELETE, PUT` | CORS allowed methods |
| `server.api.accesscontrolallowheaders` | `Content-Type` | CORS allowed headers |
| `server.api.accesscontrolexposeheaders` | (empty) | CORS exposed headers |
| `server.api.accesscontrolmaxage` | (empty) | CORS preflight cache (seconds) |
| `server.api.contentsecuritypolicy` | `frame-ancestors 'none'` | Content-Security-Policy header value |
| `server.api.xframeoptions` | `DENY` | X-Frame-Options header value |
| `http.stricttransportsecurity` | `true` | Enable Strict-Transport-Security header |

### Session management

| Property | Default | Description |
|---|---|---|
| `server.api.sessioncache` | `default` | Session cache strategy (`default` or `none`) |
| `server.api.sessionmaxinactiveinterval` | `259200` | Maximum idle time of an API session in seconds (minimum 60) |
| `server.api.sessionstore` | `false` | Store session data in the database |
| `server.api.sessionstoretable` | `sessiondata` | Database table name for session storage (only used when `server.api.sessionstore` is `true`) |

## JavaScript engine

| Property | Default | Description |
|---|---|---|
| `rhino.languageversion` | `es6` | Rhino JS language version (`1.0`-`1.8`, `es6`, `default`) |
| `rhino.optimizationlevel` | `-1` | Rhino optimization level (`-1` = interpretive, `0`-`9` = compiled with increasing optimization) |

## Administrator client

| Property | Default | Description |
|---|---|---|
| `administrator.maxheapsize` | `512m` | Max JVM heap for the Administrator |

## Configuration Map

| Property | Default | Description |
|---|---|---|
| `configurationmap.path` | `${dir.appdata}/configuration.properties` | Configuration map file location |

## Encryption and password hashing

None of these keys ship in `mirth.properties`. The server reads them when added, and uses the defaults below when they are absent.

| Property | Default | Description |
|---|---|---|
| `encryption.export` | `0` | Encrypt exported channels and files (`0` = off, `1` = on) |
| `encryption.properties` | `0` | Encrypt `database.password` in this file on next startup (`0` = off, `1` = on) |
| `encryption.algorithm` | `AES/CBC/PKCS5Padding` | Symmetric encryption algorithm, including mode and padding |
| `encryption.keylength` | `128` | Encryption key length |
| `encryption.charset` | `UTF-8` | Character set used when encrypting |
| `encryption.fallback.algorithm` | `AES` | Fallback symmetric encryption algorithm |
| `encryption.fallback.charset` | `UTF-8` | Fallback character set |
| `security.provider` | `org.bouncycastle.jce.provider.BouncyCastleProvider` | Security provider class |
| `digest.algorithm` | `PBKDF2WithHmacSHA256` | Password hash algorithm |
| `digest.saltsizeinbytes` | `8` | Salt size in bytes |
| `digest.iterations` | `600000` | Hash iterations |
| `digest.usepbe` | `1` | Derive the hash with a password-based key derivation function (`0` = off, `1` = on) |
| `digest.keysizeinbits` | `256` | Derived key size in bits |
| `digest.fallback.algorithm` | `SHA256` | Fallback password hash algorithm |
| `digest.fallback.saltsizeinbytes` | `8` | Fallback salt size in bytes |
| `digest.fallback.iterations` | `1000` | Fallback hash iterations |
| `digest.fallback.usepbe` | `0` | Fallback uses a password-based key derivation function (`0` = off, `1` = on) |
| `digest.fallback.keysizeinbits` | `256` | Fallback derived key size in bits |

## Advanced

None of these keys ship in `mirth.properties`. The server reads them when added, and uses the defaults below when they are absent.

| Property | Default | Description |
|---|---|---|
| `codebase.webstart.url` | (built from the request's scheme, host, port and context path) | Base URL written into the Administrator launch file |
| `donkey.statsupdateinterval` | `1000` | Interval in milliseconds for updating channel statistics |
| `server.startuplocksleep` | `0` | Milliseconds to wait at startup when another server's startup lock is found in the database. 0 skips the check |
| `server.api.bypassword` | (empty) | Base64-encoded bypass password for the REST API |
| `configurationmap.location` | `file` | Configuration map storage location (`file` or `database`) |
| `xstream.denytypes` | (empty) | Comma-separated list of class names to deny in XStream deserialization |
| `xstream.allowtypes` | (empty) | Comma-separated list of class names to allow in XStream deserialization |
| `xstream.allowtypehierarchies` | (empty) | Comma-separated list of class hierarchies to allow in XStream deserialization |

## Version

| Property | Default | Description |
|---|---|---|
| `version` | `4.7.0` | The engine version that last migrated this file. The server reads it at startup to decide which configuration migrations to run. Do not change it |
