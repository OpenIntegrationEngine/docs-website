---
title: Security Posture and Hardening
description: What the engine trusts and exposes as shipped, and the hardening checklist
---

# Security Posture and Hardening

For the TLS, authentication and encryption settings, see [Security and Compliance](./security_and_compliance.md).

## Customer code runs in the server JVM

Channel filters, transformers and scripts, code templates, and extensions all run in the server's JVM with the privileges of the account the server runs as. The JavaScript engine has no sandbox: a script can call any Java class on the server's classpath.

A user who can deploy a channel can therefore run code on the host as that account. That code can read the keystore and `conf/mirth.properties`, reach the database with the engine's own credentials, change any table, including the ones an authorization extension keeps its roles in, and connect to anything the host can reach. Role separation does not limit a user who can author and deploy channels.

## Defaults often reported as vulnerabilities

| Property | Status | What controls it |
|---|---|---|
| The JavaScript engine runs scripts without a sandbox | By design | Who may author and deploy channels |
| Every authenticated user may perform every operation | By design in the core | An authorization extension such as [Role Based Access Control](https://openintegrationengine.org/plugins/), within the limit above |
| The password policy enforces little | Configuration default | `password.minlength` ships at `15`, `password.retrylimit` at `100` and `password.lockoutperiod` at `1`. Every other `password.*` key ships at `0` and enforces nothing. See [User Management](./user_management.md#password-policy) |
| Keystore passwords are stored in `conf/mirth.properties` | Configuration | File permissions on the keystore and on `conf/mirth.properties` |

## Network placement

As shipped, the server listens on:

- `http.port` (8080): the status page, `webstart.jnlp` and the files the desktop Administrator downloads
- `https.port` (8443): the REST API, which both Administrators log in through
- each deployed channel's own listener port, on all interfaces unless the channel's **Local Address** names one

The engine terminates TLS on its HTTPS port and in the DICOM Listener. The TCP, HTTP and Web Service listeners accept plain connections unless an extension such as [TLS Manager](https://github.com/NovaMap-Health/tls-manager-plugin) adds TLS to them (see [Connector-level TLS](./security_and_compliance.md#connector-level-tls)). The database holds message content, which in a clinical deployment is PHI.

## Dependency currency

Renovate manages dependency updates on the engine repository: a monthly schedule, a 14-day minimum release age, automerge off, and major updates gated behind dependency-dashboard approval. OSV vulnerability alerts are on, so a disclosed vulnerability raises a pull request outside the monthly schedule.

The build resolves from Maven Central, and Gradle checks every artifact it resolves against a SHA-256 checksum in `gradle/verification-metadata.xml`, which is committed to the repository. Jars with no byte-identical artifact on Maven Central are committed in the repository's `lib` directories instead, and that check does not cover them. Signature verification is off (`verify-signatures` is `false`), and the checksums were recorded from the artifacts Gradle first resolved, so the check detects an artifact changing underneath the build, not who published it. Renovate maintains the manifest alongside the updates.

4.6.0 remediated 24 known CVEs and removed the unmaintained Xerces and xml-apis stack. The source is open under MPL 2.0.

## Hardening checklist

The checklist comes down to **FINN**:

- **F**irewall the channel listeners to known peers.
- **I**nfrastructure carries uptime. OIE runs one server per database, without clustering, so availability comes from a resilient host, database and storage underneath it.
- **N**o public IP on the engine.
- **N**arrow who can author and deploy channels.

1. Run the current release on a patched Java 17 or newer. Security fixes go only into the current minor version, per the engine's [SECURITY.md](https://github.com/OpenIntegrationEngine/engine/blob/main/SECURITY.md).
2. No public IP on the engine. Terminate external traffic at a load balancer, reverse proxy or gateway in front of it, and keep the Administrator and API port on an administrative network.
3. Bind channel listeners to specific interfaces, and restrict them by firewall to the peers that send to them.
4. Restrict channel authoring and deployment to people trusted with shell access on the host. Role separation is worth configuring for accountability and for limiting accidental damage, but it is not a boundary against someone who can write a channel.
5. Enforce a real password policy, or front authentication with a directory service. Apart from `password.minlength` (`15`) and the lockout keys, every `password.*` setting defaults to `0` and enforces nothing.
6. Require TLS 1.2 or later, use mTLS with peers that support it, and restrict the cipher list. For the TCP, HTTP and Web Service connectors these settings come from an extension such as [TLS Manager](https://github.com/NovaMap-Health/tls-manager-plugin).
7. Run under a dedicated service account with least privilege. Tighten file permissions on the keystore, properties files, and the appdata directory.
8. Use a dedicated database instance, encrypted at rest, with credentials not shared with other applications.
9. Set message storage to the minimum content level each channel needs, with a pruning schedule aligned to the retention policy.
10. Forward server and channel event logs to a SIEM. Alert on failed logins, channel deploys, and configuration changes.
11. Keep channel configuration in version control and review changes like code. The [Simple Channel History](https://github.com/diridium-com/simple-channel-history) community extension also keeps a revision of each channel and code template every time it is saved, in the engine's database. Comparing two revisions always shows a standard side-by-side diff with word-level highlighting, and a component view also breaks them down into their scripts, connectors, filter and transformer steps, and plugin properties, marking each part added, removed, modified or unchanged. Any revision can be restored.
12. Scope penetration testing to the deployed configuration.

Report engine defects as described under [Reporting security vulnerabilities](./security_and_compliance.md#reporting-security-vulnerabilities). See [Data Pruning and Maintenance](./data_pruning_and_maintenance.md) for retention settings.
