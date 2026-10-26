---
title: Server Configuration
description: Configure ports, database, TLS, and more
---

# Server Configuration

The primary server configuration file is `conf/mirth.properties`. It sets ports, database connections, TLS settings and password policies; the [Configuration Properties Reference](./configuration_properties_reference.md) lists the properties it accepts.

## Configuration file location

```text
OIE_HOME/conf/mirth.properties
```

Changes to this file require a server restart to take effect.

## Ports

```properties
# HTTP port for the status page, webstart.jnlp and downloading signed client resources
# Comment out or omit this property to only start the web server on HTTPS
http.port = 8080

# HTTPS port for the status page, REST API, Administrator, and CLI
https.port = 8443
```

### Bind addresses

```properties
# Listen on all interfaces (default)
http.host = 0.0.0.0
https.host = 0.0.0.0

# Or restrict to localhost only
# http.host = 127.0.0.1
# https.host = 127.0.0.1
```

## Context path

```properties
# Root context path (default: /)
http.contextpath = /
```

## TLS / SSL configuration

```properties
# HTTP Strict Transport Security (enabled by default)
http.stricttransportsecurity = true

# Client-side TLS protocol versions
https.client.protocols = TLSv1.3,TLSv1.2

# Server-side TLS protocol versions
https.server.protocols = TLSv1.3,TLSv1.2,SSLv2Hello

# Allowed cipher suites (comma-separated)
https.ciphersuites = TLS_CHACHA20_POLY1305_SHA256,TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256,TLS_DHE_RSA_WITH_CHACHA20_POLY1305_SHA256,TLS_AES_256_GCM_SHA384,TLS_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,TLS_RSA_WITH_AES_256_GCM_SHA384,TLS_ECDH_ECDSA_WITH_AES_256_GCM_SHA384,TLS_ECDH_RSA_WITH_AES_256_GCM_SHA384,TLS_DHE_RSA_WITH_AES_256_GCM_SHA384,TLS_DHE_DSS_WITH_AES_256_GCM_SHA384,TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDH_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDH_RSA_WITH_AES_128_GCM_SHA256,TLS_DHE_RSA_WITH_AES_128_GCM_SHA256,TLS_DHE_DSS_WITH_AES_128_GCM_SHA256,TLS_EMPTY_RENEGOTIATION_INFO_SCSV

# Ephemeral Diffie-Hellman key size
https.ephemeraldhkeysize = 2048
```

::: warning
Enabling older protocols or weaker cipher suites, or lowering the DH key size, weakens the server's TLS.
:::

### Keystore

```properties
keystore.path = ${dir.appdata}/keystore.jks
keystore.storepass = 81uWxplDtB
keystore.keypass = 81uWxplDtB
keystore.type = JCEKS
```

::: warning
When the server starts with no keystore file at `keystore.path` and both passwords still equal the default value (`81uWxplDtB`), OIE replaces them with randomly generated passwords, writes the new values back to `mirth.properties`, and creates the keystore. The keystore file stores the server certificate (for the web server and API) and the secret key used to encrypt message data, exports, and other sensitive content. **Back up this file**. If it is lost, any data encrypted with it cannot be recovered.
:::

## Database configuration

```properties
# Database type: derby, mysql, postgres, oracle, sqlserver
database = derby

# JDBC connection URL
database.url = jdbc:derby:${dir.appdata}/mirthdb;create=true

# JDBC Driver class (usually auto-detected from database type)
# database.driver =

# Credentials
database.username =
database.password =

# Connection pool type (default: HikariCP; alternative: DBCP)
# database.pool = HikariCP

# Maximum number of connections for the messaging engine pool
database.max-connections = 20

# Retry configuration on startup
database.connection.maxretry = 2
database.connection.retrywaitinmilliseconds = 10000
```

The pool's validation query is not read from this file. The engine derives it from the database type, and the default HikariCP pool applies it only when the type is `sqlserver`.

### Read/write pool splitting

When enabled, the connection pool splits into a read-only pool and a read/write pool. The read-only pool serves most Administrator API calls that only fetch data, while the read/write pool handles message processing and any operation that modifies data. You can optionally point the read-only pool at a separate read replica.

```properties
# Enable read/write connection pool splitting (default: true)
database.enable-read-write-split = true

# Maximum number of connections for the read-only pool
# (when not set, the server writes 20 here at first start)
database-readonly.max-connections = 20

# Read-only pool overrides (each defaults to the main pool value when not set)
# Database type for the read-only pool: derby, mysql, postgres, oracle, sqlserver
# database-readonly =
# database-readonly.url =
# database-readonly.driver =
# database-readonly.username =
# database-readonly.password =
# database-readonly.pool =

# Use the write pool for internal caches (set to true if the read replica lags)
database.write-pool-cache = false
```

See [Database Support](./database_support.md) for connection URL examples for each database type.

## Password policy

```properties
# Minimum password length (0 = no minimum)
password.minlength = 15

# Minimum uppercase characters
password.minupper = 0

# Minimum lowercase characters
password.minlower = 0

# Minimum numeric characters
password.minnumeric = 0

# Minimum special characters
password.minspecial = 0

# Failed login attempts allowed before lockout (0 = no lockout)
password.retrylimit = 100

# Lockout duration in hours (0 = no lockout, even when retrylimit is set)
password.lockoutperiod = 1

# Days until a password expires (0 = never)
password.expiration = 0

# Days a user may still log in after the password expires (0 = unlimited, -1 = no grace period)
password.graceperiod = 0

# Days before a previous password may be reused (0 = always allow, -1 = never)
password.reuseperiod = 0

# Times a previous password may be reused (0 = no limit, -1 = never)
password.reuselimit = 0
```

The values above are what 4.7.0 ships. A key that is absent from the file is read as `0`. See the [Configuration Properties Reference](./configuration_properties_reference.md) for the full table.

## Server behavior

```properties
# Deploy channels automatically on server startup
server.startupdeploy = true

# Include jars from custom-lib/ on the server classpath
# To avoid classpath conflicts, prefer using Resources instead
server.includecustomlib = false

# Server URL shown in the Administrator launcher (empty = auto-detect)
server.url =

# Password for the admin user, applied only when the database is first created.
# If blank, a random password is generated and written to the log once.
server.initialadminpassword =

# Auto-generate a new server ID on every startup (useful for containers)
server.id.ephemeral = false

# Interval (ms) to update channel statistics across all channels
donkey.statsupdateinterval = 1000
```

## API security

```properties
# Require X-Requested-With header on API requests (CSRF protection)
server.api.require-requested-with = true

# Content-Security-Policy header on API responses
server.api.contentsecuritypolicy = frame-ancestors 'none'

# X-Frame-Options header on API responses
server.api.xframeoptions = DENY
```

### CORS headers

```properties
server.api.accesscontrolalloworigin = *
server.api.accesscontrolallowcredentials = false
server.api.accesscontrolallowmethods = GET, POST, DELETE, PUT
server.api.accesscontrolallowheaders = Content-Type
server.api.accesscontrolexposeheaders =
server.api.accesscontrolmaxage =
```

### Session management

```properties
# Store sessions in the database (for clustered deployments)
server.api.sessionstore = false

# Max session idle time in seconds (default: 259200 = 72 hours, minimum: 60)
server.api.sessionmaxinactiveinterval = 259200
```

## JavaScript engine

```properties
# Rhino JavaScript language version
# Valid values: es6, default, 1.0-1.8
rhino.languageversion = es6

# Rhino optimization level (-1 = interpretive, 0-9 = compiled with increasing optimization)
# -1 is less efficient but allows very large/complex scripts to compile
rhino.optimizationlevel = -1
```

## Administrator client

```properties
# Default maximum heap size for the Administrator client (not the server)
administrator.maxheapsize = 512m
```

## Application data

```properties
# Application data directory
dir.appdata = appdata

# Temp data directory
dir.tempdata = ${dir.appdata}/temp

# Configuration map storage: file or database (default: file)
# configurationmap.location = file

# Configuration map file path (when location = file)
configurationmap.path = ${dir.appdata}/configuration.properties
```

## Encryption

```properties
# Encrypt exported channels and files from the Administrator (0 = off, 1 = on)
encryption.export = 0

# Auto-encrypt database.password in this file on next startup (0 = off, 1 = on)
encryption.properties = 0

# Symmetric encryption algorithm
encryption.algorithm = AES/CBC/PKCS5Padding

# Encryption key length
encryption.keylength = 128
```

## Password hashing

```properties
# Digest algorithm for password hashes
digest.algorithm = PBKDF2WithHmacSHA256

# Salt size in bytes
digest.saltsizeinbytes = 8

# Iterations for the digest algorithm
digest.iterations = 600000

# Derive the hash with a password-based key derivation function (0 = off, 1 = on)
digest.usepbe = 1

# Derived key size in bits, used when digest.usepbe = 1
digest.keysizeinbits = 256
```

::: info
A stored password hash holds only the salt and the digest, not the settings that produced it. To check a password, the engine tries the `digest.*` settings above, then the `digest.fallback.*` settings. So after you change any `digest.*` setting, an existing password still works only if the `digest.fallback.*` keys describe the settings it was hashed with. When the fallback keys are absent, the fallback is SHA256 with an 8-byte salt, 1000 iterations and no password-based key derivation, the defaults before 4.4.0. A password that matches neither no longer works, and its user cannot log in until it is reset.
:::

## Other configuration files

The `conf/` directory contains additional configuration files:

| File | Purpose |
|---|---|
| `log4j2.properties` | Controls server log levels, file rotation, and output format |
| `log4j2-cli.properties` | Same as above, but specific to the CLI |
| `dbdrivers.xml` | Read for the Database connector's Driver drop-down only while no driver list is stored in the database. Saving the list from the Administrator's driver dialog, or an upgrade from a schema older than 3.8.0, stores a copy in the database and the file is no longer read |
| `mirth-cli-config.properties` | Stores CLI connection defaults (address, user, password) |

With the shipped paths, the `appdata/` directory holds the server's data:

| File | Purpose |
|---|---|
| `mirthdb/` | The embedded Derby database, used while `database` is `derby`, the default (`database.url`) |
| `keystore.jks` | Server certificate, secret encryption key (`keystore.path`) |
| `extension.properties` | Stores enabled/disabled state of all installed extensions |
| `server.id` | Unique server identifier (auto-generated on first startup) |
| `configuration.properties` | Stores the Configuration Map as key-value pairs (`configurationmap.path`). Created when the Configuration Map is first saved |
| `temp/` | Temporary files (`dir.tempdata`) |

## JVM options

The launcher reads `oieserver.vmoptions`, which contains only `-include-options` directives for the files below and must not be edited. Put JVM settings in `conf/custom.vmoptions`:

```text
# Maximum heap size. conf/base_includes.vmoptions sets -Xmx256m; custom.vmoptions
# is included last, so the value here takes effect.
-Xmx1g

# Pin the Java installation. The value is the Java home directory, not the java binary.
# -jvm=/path/to/java-home
```

Do not put a `-java-cmd` line in `custom.vmoptions` of a 4.7.0 install or archive: the server does not start. The comments in the shipped `custom.vmoptions` that mention `-java-cmd` do not apply. See [Choosing a Java](./server_process_management.md#choosing-a-java) for how the launcher chooses one.

The files `oieserver.vmoptions` includes, in order:
- `conf/base_includes.vmoptions`: Base JVM settings (heap size, headless mode)
- `conf/default_modules.vmoptions`: Default module inclusions
- `conf/custom.vmoptions`: User-defined custom JVM options

### Environment variables

| Variable | Purpose |
|---|---|
| `INSTALL4J_JAVA_HOME_OVERRIDE` | Java home directory for the launcher. Takes the same value as `-jvm=` |
| `JAVA_HOME` | Standard Java installation path. The launcher ignores it when a `java` is on the `PATH` |
