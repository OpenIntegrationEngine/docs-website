---
title: Upgrade Guide
description: How to upgrade to a newer version
---

# Upgrade Guide

To move an existing Mirth Connect server onto OIE, see [Migrating from Mirth Connect](./migrating_from_mirth_connect.md).

## Before you upgrade

### 1. Back up everything

Back up:

- **Server configuration**: Export via the Administrator (**Settings > Server Tab > Server Tasks > Backup Config**) or via the CLI (`exportcfg "path"`). The export holds channels, channel groups, tags and dependencies, code templates, alerts, global scripts, the configuration map, resources, server settings, and plugin properties.

  > **Warning:** The Server Configuration file does **not** include user accounts, events, or message/attachment data. Back those up separately if needed.

- **Database**: If using the embedded Derby database, back up the `appdata/mirthdb` folder. If using an external database (PostgreSQL, MySQL, Oracle, SQL Server), create a backup using your database administration tool.
- **Application data directory** (`appdata/`): Holds the keystore, the server id, and the embedded Derby database
- **Configuration files** (`conf/`): Especially `mirth.properties` and any customized files
- **Custom database driver entries**: If you have added entries to `conf/dbdrivers.xml`, back up that file
- **JVM parameters**: If you have modified heap size or other JVM settings, back up all `*.vmoptions` files in the installation directory and in `conf/`
- **CLI configuration**: If you have customized `conf/mirth-cli-config.properties`, back up that file
- **Custom libraries**: If you created a `custom-lib/` directory for your own JARs, back it up. The install does not create it. The launcher adds it to the server classpath only when `server.includecustomlib` is not `false`, and the shipped `mirth.properties` sets it to `false`. Channel scripts still load its JARs through the **[Default Resource]** in **Settings > Resources**, whatever that setting says

### 2. Read the release notes

Read the release notes of every version after yours, up to and including the one you are installing, on the [Releases page](https://github.com/OpenIntegrationEngine/engine/releases). Note each setting whose default changed and each key that was added: you merge them into your own configuration in [Merging your configuration](#merging-your-configuration). For 4.7.0 they are summarized in [Upgrading to 4.7.0](#upgrading-to-4-7-0).

### 3. Plan downtime

Upgrading requires stopping the server.

## Upgrade process

### Using the installer

1. Exit the **Administrator** and stop the **server service/daemon**
2. Run the new version's installer against the existing installation directory. Unattended on Linux: `sh oie_unix_<version>.sh -q -dir <installation directory>`. It removes the previous version and installs the new one
3. The installer keeps `appdata/` and leaves every file in `conf/` exactly as it was. None of the new version's configuration defaults are added; see [Merging your configuration](#merging-your-configuration)
4. The installer replaces `oieserver.vmoptions` and `oieservice.vmoptions` in the installation directory. Put options you added there back afterwards, or keep them in `conf/custom.vmoptions`, which both files include and which the installer keeps
5. Start the server. It runs any required database schema migration at startup and writes the new version into the `version` line of `conf/mirth.properties`

### Using pre-packaged distributions

For archive-based installations (ZIP/TAR.GZ):

1. Exit the **Administrator** and stop the **server service/daemon**
2. Back up the entire installation directory
3. Extract the new version to a new location
4. Copy your `appdata/` directory to the new installation
5. Merge your configuration into the new installation's `conf/`; see [Merging your configuration](#merging-your-configuration)
6. Copy `custom-lib/` if you created one, and any extension you installed yourself from `extensions/`. Each extension needs a build for the new version; see [Plugin compatibility and version requirements](./plugins.md#plugin-compatibility-and-version-requirements)
7. Start the server from the new installation directory. It runs any required database schema migration at startup and writes the new version into the `version` line of `conf/mirth.properties`

### Merging your configuration

Neither upgrade path updates your configuration. The installer keeps your `conf/` unchanged, and an archive upgrade uses the files you bring. Merge with the release notes in hand:

1. Compare your `conf/` with the new version's, for example `diff -r <old installation>/conf <new installation>/conf`
2. Start from your own `mirth.properties`, not the new one. A server that has run has written values into it that belong to your data: the keystore passwords generated at its first start (`keystore.storepass` and `keystore.keypass`), which open `appdata/keystore.jks`, and its `database.url`. The new version's file has the shipped keystore password, which does not open your keystore. With the wrong keystore password the server logs `Could not initialize security settings` and `Could not start web server`, then reports that it started, with no Administrator and no API
3. Leave the `version` line as it is. The server reads it at startup to decide which configuration migrations to run, then writes the new version into it
4. Add the keys the new version introduces, and change each default the release notes say changed wherever you want the new value
5. Do the same for `custom.vmoptions` and any other file the comparison shows

### Using Docker

No 4.6.0 or 4.7.0 container image is published. The `openintegrationengine/engine` repository on Docker Hub has a single tag, `latest`, which is the 4.5.2-tp.1 technology preview. The 4.7.0 release notes describe a Docker build inside the engine repository instead, and say they "do not announce a new published image or registry tag".

## After the upgrade

### 1. Verify server startup

Check the server logs (`logs/mirth.log`) for:
- Successful startup messages
- Database migration completion
- Extension loading
- Any errors or warnings

### 2. Check Database Tasks

Navigate to **Settings > Database Tasks** in the Administrator. The tasks it can list remove tables left over from upgrades of 2.x and pre-3.3 servers, and add a metadata index used by queues. An upgrade from 4.6.0 adds none. If the list is empty there is nothing to run.

- These tasks are **not** run automatically. Select a task row and click **Run Task** in the task panel on the left. A task can be cancelled with **Cancel Task**
- **Add Metadata Index** creates the index only on channels that are stopped
- Tasks may take a long time on large databases; monitor progress via the Status column and server logs

### 3. Verify channels

1. Check that all channels are in their expected state (deployed/undeployed)
2. Start channels and verify message processing
3. Check the Message Browser for any errors
4. Test critical interfaces end-to-end

### 4. Verify extensions

Check **Extensions** in the Administrator to ensure all plugins and connectors loaded correctly. An extension built for an earlier version is not loaded; check the server log for errors and install updated versions.

## Rollback plan

If the upgrade fails:

1. Stop the server
2. Restore from your backup:
   - Replace the installation directory with the backup
   - Restore the database from backup (if using an external database) or restore the `appdata/mirthdb` folder (if using embedded Derby)
   - Restore `conf/mirth.properties` and any other customized configuration files
3. Start the old version

You can also restore a server configuration backup via the Administrator (**Settings > Server Tab > Server Tasks > Restore Config**). It overwrites all current channels, alerts, code templates, server properties, global scripts, and plugin properties. Its confirmation dialog has two options: **Deploy all channels after import**, ticked by default, and **Overwrite Configuration Map**, unticked by default, so the configuration map is restored only if you tick it.

::: warning
Once the new version has started on a database, the old version cannot use it. 4.6.0 started on a database that 4.7.0 has used logs `Failed to migrate database schema` and does not start. Restore the database from your backup before starting the old version.
:::

## Common upgrade issues

### Java version mismatch
Newer OIE versions may require a newer Java version. Check the release notes for the minimum Java requirement and update Java before upgrading.

## Version-specific notes

### Upgrading to 4.7.0

The 4.7.0 release notes list their breaking changes under **Breaking changes and upgrade considerations**; read that section in full. These are the ones that affect an existing installation:

**An older engine cannot use the upgraded database.** After 4.7.0 has started on a database, 4.6.0 fails at startup with `Failed to migrate database schema`. Going back means restoring the database backup; see [Rollback plan](#rollback-plan).

**Your configuration keeps its old password policy.** A new 4.7.0 `conf/mirth.properties` sets `password.minlength = 15`, `password.retrylimit = 100` and `password.lockoutperiod = 1`, where 4.6.0 shipped `0` for all three. An upgraded installation keeps its own values until you merge the new ones. See [Password policy](./user_management.md#password-policy).

**The generated admin password applies to new databases only.** The new `server.initialadminpassword` key, and the password 4.7.0 generates when it is blank, are used only when the database is first created. An upgraded database keeps its users and their passwords. See [Initial admin password](./accessing_the_administrator.md#initial-admin-password).

**If you started 4.6.0 with `oieserver.ps1`, pin Java another way.** 4.7.0 no longer ships `oieserver.ps1`, and the Linux installer removes it on upgrade. The `oieserver` launcher in installs and archives is generated by install4j. It ignores `OIE_JAVA_PATH`, and a `-java-cmd` line in `conf/custom.vmoptions` stops it from starting, so remove that line and pin a Java with `-jvm=` instead. `JAVA_HOME` is ignored when a `java` is on the `PATH`. See [Choosing a Java](./server_process_management.md#choosing-a-java).

**The bundled Java is 21.** The with-JRE installers bundle Eclipse Temurin JDK 21.0.12.1 in place of Azul Zulu 17. See [Choosing an installer](./installation.md#choosing-an-installer). On Java 21 the Web Service Listener fails every SOAP request; see [Web Service Listener](./connector_reference_sources.md#web-service-listener).

**Extensions need a 4.7.0 build.** An extension whose `<mirthVersion>` does not list `4.7.0` is not loaded. See [Plugin compatibility and version requirements](./plugins.md#plugin-compatibility-and-version-requirements).

**Two script behaviors changed.** A preprocessor, global or channel, that ends without `return` now leaves the message unchanged, where 4.6.0 replaced the message with the text `undefined`. In the postprocessor, `channelName` now holds the channel's name, where 4.6.0 left it null. See [Global preprocessor script](./global_scripts.md#global-preprocessor-script).

**The extension launch descriptor endpoint is gone.** `/webstart/extensions/<extension>.jnlp` now answers 404; extension resources are listed in the main launch descriptor, `/webstart.jnlp`. A custom launcher that fetched the per-extension descriptors needs updating.

The release notes also list these, which apply only if you use the feature named:

- **SQL Server through the Microsoft driver**: the bundled driver moves from 8.4.1 to 10.2.4, which encrypts connections by default. An engine whose own database is on SQL Server through this driver stops at startup with `PKIX path building failed` unless the server's certificate is trusted by the Java runtime; adding `;trustServerCertificate=true` to `database.url` lets it start but skips certificate validation. Channel connections through the driver are affected the same way
- **XML with a DOCTYPE**: DOCTYPE declarations are rejected in source XML passed to XSLT steps, XML batch splitting, and the strict HL7 v2 XML parser
- **HTTP Listener**: the new request-header-size setting keeps the 8192-byte limit for existing channels; a value that is not a positive integer stops the connector from starting
- **Custom metadata filters** in API calls must name configured columns exactly
- **`selectLimit`** in Database Drivers settings and `dbdrivers.xml`, and the `selectLimit` parameter of `POST /connectors/jdbc/_getTables`, are ignored
- **The Administrator** checks for JavaFX at startup and stops with a message when the `javafx.graphics` module is missing
- **The CLI** returns nonzero exit codes for startup failures (authentication, connection, configuration, usage, unreadable script). This does not cover every failed command inside a script
- **JSON** handled through Jackson has new parsing limits on nesting depth and token length
- **Custom Java code**: `EngineController` adds an abstract `dispatchRawMessage` overload and `MessageServletInterface` adds `processBatchMessage`; the release notes list further API changes
- **Source builds** use Gradle instead of Ant; see [Building from Source](./building_from_source.md)

### Upgrading to 4.6.0

The 4.6.0 release notes list four changes that can break a working installation or change behavior silently.

**Java 17 is the minimum.** Older JVMs are no longer supported. The release notes say later Java LTS releases should work but are not officially tested, so a server pinned to Java 11 needs its runtime updated first.

**Xerces and xml-apis have been removed.** Custom code that imports `org.apache.xerces.*` directly will fail to load. Migrate those imports to `javax.xml.parsers.*` and `org.xml.sax.*`. This affects code templates, channel scripts, and custom extensions alike. Search your scripts for the old package before you upgrade.

**Logins are case-insensitive by default.** `admin`, `Admin`, and `ADMIN` now resolve to the same account. Existing accounts with case-sensitive usernames continue to work through a compatibility path.

**HTTP parameter map ordering is now preserved.** Previously the order was non-deterministic. A script that depends on the old ordering may behave differently.

Two operational notes from the same release notes:

- Installers remove the prior release as part of the upgrade, preserving the directories that must survive it, including `appdata`, `conf`, `extensions`, and `logs`.
- The release remediates 24 known CVEs (1 critical, 10 high, 12 medium, 1 low) through dependency upgrades.

The full release notes, including the complete dependency and CVE list, are published with the [v4.6.0 release](https://github.com/OpenIntegrationEngine/engine/releases/tag/v4.6.0).
