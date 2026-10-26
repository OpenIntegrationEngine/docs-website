---
title: Security and Compliance
description: TLS, CSRF and CORS settings, authentication, and encryption
---

# Security and Compliance

The hardening checklist is on [Security Posture and Hardening](./security_posture_and_hardening.md#hardening-checklist).

## Transport Layer Security (TLS)

### Server TLS configuration

These keys in `conf/mirth.properties` are read at startup. `https.server.protocols` goes to the HTTPS listener that serves the REST API and the Administrator, and to the DICOM Listener. `https.client.protocols` covers TLS connections the server opens (HTTP Sender, Web Service Sender, SMTP Sender, DICOM Sender, alert email). `https.ciphersuites` is one list shared by the HTTPS listener and by the HTTP Sender, Web Service Sender, SMTP Sender and alert email, so shortening it for the listener also changes what those senders negotiate; the DICOM connectors read the protocol lists only. When `https.client.protocols` or `https.ciphersuites` differs from the shipped value, the server also writes both into the launch file (`webstart.jnlp`) that starts the desktop Administrator, and an Administrator started from it uses them for its connection to the server. The cipher suite list is split on commas, and any name the JVM does not support is dropped before the rest are enabled, so a misspelt name is ignored rather than reported. `https.ephemeraldhkeysize` is copied into the JVM's `jdk.tls.ephemeralDHKeySize`, clamped to 1024 through 2048, unless that system property is already set. The block shows the shipped defaults.

```properties
# TLS protocol versions for connections the server opens
https.client.protocols = TLSv1.3,TLSv1.2

# TLS protocol versions accepted by the HTTPS listener
https.server.protocols = TLSv1.3,TLSv1.2,SSLv2Hello

# Enabled cipher suites, comma-separated on one line
https.ciphersuites = TLS_CHACHA20_POLY1305_SHA256,TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256,TLS_DHE_RSA_WITH_CHACHA20_POLY1305_SHA256,TLS_AES_256_GCM_SHA384,TLS_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,TLS_RSA_WITH_AES_256_GCM_SHA384,TLS_ECDH_ECDSA_WITH_AES_256_GCM_SHA384,TLS_ECDH_RSA_WITH_AES_256_GCM_SHA384,TLS_DHE_RSA_WITH_AES_256_GCM_SHA384,TLS_DHE_DSS_WITH_AES_256_GCM_SHA384,TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDH_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDH_RSA_WITH_AES_128_GCM_SHA256,TLS_DHE_RSA_WITH_AES_128_GCM_SHA256,TLS_DHE_DSS_WITH_AES_128_GCM_SHA256,TLS_EMPTY_RENEGOTIATION_INFO_SCSV

# Ephemeral Diffie-Hellman key size in bits
https.ephemeraldhkeysize = 2048
```

### Keystore management

The keystore holds the certificate the HTTPS listener presents and the secret key behind the server's encryptor. These keys in `conf/mirth.properties` name it. On the first start with no keystore file, the server creates one, generates a certificate authority and a server certificate signed by it (both valid for 50 years), and, when both passwords still equal the shipped default `81uWxplDtB`, replaces them with random 12-character values and writes `mirth.properties` back. A keystore file that already exists at `keystore.path` is loaded with whatever `mirth.properties` holds, default included, and when only one of the two passwords was changed by hand neither is replaced. The block shows the keys as they stand after a first start that created the keystore; the passwords are placeholders for the generated values, so do not paste this block.

```properties
keystore.path = ${dir.appdata}/keystore.jks
keystore.storepass = (generated)
keystore.keypass = (generated)
keystore.type = JCEKS
```

Passwords set by hand before the first start are kept as they are. The [TLS Manager](https://github.com/NovaMap-Health/tls-manager-plugin) community extension keeps its own certificates and key pairs, in the database by default, and adds a web certificate manager that also lists the Java trust store; it is not part of the engine.

### Connector-level TLS

What each connector encrypts:
- **HTTP Sender** and **Web Service Sender**: an `https://` URL opens a TLS connection using `https.client.protocols` and `https.ciphersuites`
- **SMTP Sender**: the Encryption setting is None, STARTTLS (upgrades the connection after connecting) or SSL (TLS on connect), with the same protocol and cipher suite lists
- **File Reader/Writer**: SFTP, HTTPS for the WebDAV scheme, and HTTPS to the AWS endpoint for the configured region for the Amazon S3 scheme. FTP is plain; there is no FTPS. The SMB scheme sets the minimum and maximum SMB version and has no encryption setting
- **Database Reader/Writer**: no TLS setting of its own; encryption depends on the JDBC driver and the URL
- **JMS Listener/Sender**: no TLS setting of its own; encryption depends on the JMS provider's configuration
- **DICOM Listener/Sender**: a TLS setting on each connector (No TLS, AES, 3DES, or Without) with its own key store and trust store; the listener uses `https.server.protocols`, the sender `https.client.protocols`. With the JDK's default security settings on Java 17 and 21, 3DES, AES and Without fail; see the box under [DICOM Listener](./connector_reference_sources.md#dicom-listener)
- **TCP Listener/Sender**, **HTTP Listener** and **Web Service Listener**: plain sockets and plain HTTP. Each builds its connections from a class named in a server property (`tcpConfigurationClass`, `httpConfigurationClass`, `wsConfigurationClass`), which an extension can set to a class that adds TLS; the engine ships none

The [TLS Manager](https://github.com/NovaMap-Health/tls-manager-plugin) community extension replaces the HTTP, Web Service and TCP connectors with TLS-capable ones, listeners and senders both. It adds mTLS, certificate revocation checks (CRL and OCSP), subject DN and hostname validation, and the permitted TLS versions and cipher suites per connector, and it supports OIE 4.5.2 and later.

## CSRF protection

The REST API requires an `X-Requested-With` header by default. The key in `conf/mirth.properties`:

```properties
server.api.require-requested-with = true
```

The header's value is not inspected; any non-blank value passes. A request without it gets HTTP 400 and never reaches the API. This is the Cross-Site Request Forgery guard, and every API client must send the header.

## CORS configuration

The `ApiOriginFilter` reads six keys from `conf/mirth.properties` at startup and adds the matching `Access-Control-*` header to every API response. A key left blank adds no header. The block shows the shipped values:

```properties
# CORS headers
server.api.accesscontrolalloworigin = *
server.api.accesscontrolallowcredentials = false
server.api.accesscontrolallowmethods = GET, POST, DELETE, PUT
server.api.accesscontrolallowheaders = Content-Type
server.api.accesscontrolexposeheaders =
server.api.accesscontrolmaxage =
```

`accesscontrolalloworigin` is sent verbatim as `Access-Control-Allow-Origin`; the filter does not compare it with the request's `Origin` header, and the header takes a single origin or `*`. `accesscontrolallowcredentials` is sent as `true` or `false`, and `accesscontrolmaxage` as a number of seconds, falling back to `300` when the value does not parse. Keep comments on their own line: everything after the `=` is the value, so a trailing `# note` would be sent as part of the header.

Set `server.api.accesscontrolalloworigin` to the one origin that needs access instead of `*`.

## Authentication and access control

### Password policy
The shipped `conf/mirth.properties` sets `password.minlength = 15`, `password.retrylimit = 100` and `password.lockoutperiod = 1`. Every other `password.*` key ships at `0`, which turns its check off. [User Management](./user_management.md#password-policy) lists every key and what each one controls.

### Account lockout
Lockout after failed logins is on as shipped (`password.retrylimit = 100`, `password.lockoutperiod = 1`). Two keys control it:
- `password.retrylimit`: Consecutive failed logins allowed before the account locks; `0` disables lockout
- `password.lockoutperiod`: Hours the account stays locked, counted from the last failed login; `0` means the account never locks, whatever `password.retrylimit` says

A failed login gets the same response whatever the cause: a wrong password, an unknown username and a locked account all return `FAIL` with the message `Login failed.`, and take about the same time. When an account locks, the server logs a `User account locked` event at Warning level with the username and the time the lock ends.

::: danger Broken in 4.7.0
Failed logins show which usernames exist. With lockout on, a failed login for an existing account says how many attempts are left before it locks, and a locked account's login says when it unlocks, while an unknown username gets only `Incorrect username or password.` Response time shows it too, with or without lockout: a login for an unknown username returns sooner than one for a real account. Reported in [engine issue #240](https://github.com/OpenIntegrationEngine/engine/issues/240); fixed by [engine PR #439](https://github.com/OpenIntegrationEngine/engine/pull/439), merged after 4.7.0, not yet in a release.
:::

Keep the Administrator and API port on an administrative network; see [Network placement](./security_posture_and_hardening.md#network-placement).

### Multi-factor authentication
Multi-factor authentication comes from an extension. A plugin that extends `MultiFactorAuthenticationPlugin` runs after the password check succeeds and asks for the second factor through its client-side part. The engine ships none.

### Role-based access control (RBAC)
The engine has no role model: every user is authorized for every operation, so every account can do everything the API allows. The [Role Based Access Control](https://openintegrationengine.org/plugins/) community extension adds roles and per-channel grants.

## Encryption

### Data at rest
- With `encryption.properties = 1` in `conf/mirth.properties` (the key is not in the shipped file and defaults to off), the server encrypts `database.password` and `database-readonly.password` with the keystore's secret key at the next start and writes them back to `mirth.properties` with an `{enc}` prefix; the keystore holds the key, not the credential
- The `EncryptionUtil` scripting class encrypts and decrypts strings and byte arrays with the server's encryptor, which is keyed from the keystore and uses `AES/CBC/PKCS5Padding` by default
- Each channel's Message Storage settings on the Summary tab can encrypt what the channel writes to the database: **Encrypt message content**, **Attachments** and **Custom metadata**, each with the keystore's secret key. All three are off by default. An attachment a script adds with `addAttachment()` is stored in plain text even with **Attachments** on
- Files the Administrator exports, such as channels, are encrypted with the same key when `encryption.export = 1` (off as shipped), and so are message exports and archives with the Encrypt option on

### Data in transit
- Logins and REST API traffic use TLS on the engine's HTTPS port (`https.port`, 8443 as shipped). The status page, `webstart.jnlp` and the jars the desktop Administrator downloads are also served on the HTTP port (`http.port`, 8080 as shipped) when it is enabled, which it is by default
- Connectors: see [Connector-level TLS](#connector-level-tls)

### Keystore
The JCEKS keystore holds two entries:
- The HTTPS listener's certificate and private key, alias `mirthconnect`
- The secret key of the server's encryptor, alias `encryption`

## Reporting security vulnerabilities

Report vulnerabilities confidentially to the Eclipse Foundation Security Team at **security@eclipse-foundation.org**, following the process at [eclipse.org/security](https://www.eclipse.org/security/). The engine's [SECURITY.md](https://github.com/OpenIntegrationEngine/engine/blob/main/SECURITY.md) has the policy.
