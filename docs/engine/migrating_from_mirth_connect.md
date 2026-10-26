---
title: Migrating from Mirth Connect
description: What changes, what does not, and what to prepare before moving a Mirth Connect server onto OIE
---

# Migrating from Mirth Connect

A migration moves an existing Mirth Connect server onto OIE on the same host, in this order:

- Install OIE alongside it, without starting it
- Start OIE once on its own to prove it runs, before anything of Mirth's is touched
- Transplant the relevant configurations
- Stop Mirth and start OIE
- Disable the Mirth installation

Then follow the procedure for your platform: **[Linux](./migrating_linux.md)**,
**[Windows](./migrating_windows.md)** or **[macOS](./migrating_macos.md)**.

::: warning NextGen premium extensions do not migrate
Work out what replaces
anything you depend on before you start. See
[Extension compatibility](#extension-compatibility).
:::

OIE kept Mirth's filenames, so an OIE installation has its own `conf/mirth.properties` and
`logs/mirth.log`. Most files sit at the same relative path in
both installations, so the full path is what tells them apart. Each platform page states the
paths it uses.

## Scope

- **The same host.** Mirth and OIE are installed side by side and the cutover happens in one maintenance window.
- **Either database.** An external PostgreSQL, MySQL, Oracle or SQL Server, or the embedded Derby database. Steps 6 and 8 branch on which one you run.
- **The native installer with a bundled JRE.** The server runs on the bundled runtime, so the host's Java version does not matter.
- Docker is not covered here. [Upgrade Guide](./upgrade_guide.md) has a container path for OIE-to-OIE upgrades.

The procedure has been used to migrate from Mirth Connect 4.5.x. [What migrates](#what-migrates) describes what the server does with an older starting version.

## What migrates

The server records a schema version in the database. On startup it migrates from that version up to its own.

From Mirth Connect 4.3.0 or later, OIE 4.7.0 changes no table and no column. The recorded version becomes 4.7.0, which Mirth Connect cannot run on, so your database backup is the only way back. See [Version-specific notes](./upgrade_guide.md#version-specific-notes).

From a version below 4.3.0, the schema changes as well.

::: warning Merge mirth.properties rather than replacing it
The database migrates from the version recorded in the database, not from `mirth.properties`. The `version` property in `mirth.properties` records which version the file came from: at startup the server applies every later version's property changes to the file, then sets `version` to its own. Copying Mirth's file wholesale replaces OIE's shipped settings, such as its password policy, with Mirth's.
:::

## Extension compatibility

An extension declares a `<mirthVersion>` in its `plugin.xml`, `source.xml` or `destination.xml`. The server compares that value against its own version as an exact string. There is no version range.

An extension built for Mirth Connect 4.5.2 declares `4.5.2` and will not load on OIE 4.7.0. The server logs an error and does not load it.

The version string decides whether the server loads an extension. Whether it then works is up to the extension's own code. For an extension you build or maintain yourself, the value takes a comma-separated list, so `4.5.2,4.7.0` declares both. For anything you did not build, get a build published for 4.7.0 rather than editing someone else's metadata.

### Premium extensions

Nothing in OIE validates a license: extension metadata carries no license field, and installing an extension checks your permission and the version string, nothing else. A paid extension can carry its own license check inside its own code, and whether a license issued for Mirth Connect functions from an OIE installation is a question for whoever sold it to you.

Examples of premium capabilities that have a community plugin:

| Capability | Community plugin | What to expect |
|---|---|---|
| TLS and certificate management | [TLS Manager](https://github.com/NovaMap-Health/tls-manager-plugin), NovaMap-Health | Channels configured against the premium plugin's TLS need reworking. Channels on non-TLS connectors are unaffected |
| Channel and code template history | [Channel & Code Template History](https://github.com/diridium-com/simple-channel-history), diridium-com | History starts from the day you install it. Existing history does not come across |

Neither plugin is published as a replacement for a paid product. The
[plugin directory](https://openintegrationengine.org/plugins/) is the current list.

*Mirth Connect and NextGen are trademarks of NextGen Healthcare, which is not affiliated with, does not endorse, and does not sponsor this project.*

## What the keystore holds

`appdata/keystore.jks` holds two things under fixed aliases. `mirthconnect` is the TLS certificate the server presents. `encryption` is an AES secret key, and what that key covers decides whether the keystore has to come across with the database.

The key is used for:

- Message content, attachments and custom metadata columns written to the database. Each has its own per-channel setting, and all three are off by default. With only message content on, attachments and custom metadata columns are stored in plain text. An attachment a script adds with `addAttachment()` is stored in plain text even with all three on.
- The `database.password` and `database-readonly.password` values in `mirth.properties`, when `encryption.properties` is enabled. That defaults to off. An encrypted value is visible in the file by its `{enc}` prefix.
- Anything a channel script encrypts through the `EncryptionUtil` API.
- Messages written by a message export or an archive with the Encrypt option on.
- Files the Administrator exports, such as channels, when `encryption.export = 1` is set in `mirth.properties`. That defaults to off.

If none of those apply, the keystore carries your TLS identity and nothing else. If any of them apply, pointing OIE at Mirth's database without Mirth's keystore leaves that data unreadable.

::: warning The keystore and its passwords travel together
`keystore.storepass` and `keystore.keypass` must be the values that match the copied `keystore.jks`. On a mismatch the server logs `Could not initialize security settings.` and **carries on starting**. Check `logs/mirth.log` for that line.
:::

## Before you start

Take the backups listed in [Upgrade Guide](./upgrade_guide.md#_1-back-up-everything). They apply here unchanged, and the database backup is the rollback.

Two additions specific to this move:

- **Record what the Mirth service runs as** and what owns its install directory. Step 4 reproduces both.
- **List your extensions and their declared versions.** Step 6 checks them against 4.7.0.

::: warning A server configuration export is not a backup
The export at **Settings > Server Tasks > Backup Config**, and `exportcfg` on the CLI, omits user accounts entirely, and the matching restore has no step that would put them back. It also excludes the keystore, `mirth.properties` and the message database. It will not rebuild a server.
:::

## Platforms

The eleven steps are the same on every platform. What differs is how you set the service
account, change file ownership, and start, stop and disable a service.

- **[Linux](./migrating_linux.md)**, complete
- **[Windows](./migrating_windows.md)**, not written yet
- **[macOS](./migrating_macos.md)**, not written yet

If you have done this migration on Windows or macOS, those pages would be welcome. The
Linux page is the template: the same eleven steps, with the service and file commands
replaced. See [Contributing](./contributing.md).
