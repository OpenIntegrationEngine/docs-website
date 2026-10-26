---
title: Installing Open Integration Engine
description: System requirements, choosing an installer, and installing on Windows, macOS and Linux
---

# Installation

Open Integration Engine™️, also called OIE™️ in this documentation, installs from a native
installer on Windows, macOS and Linux.

## System requirements

The OIE Server operates as a self-contained application and does not depend on any external application server.

### Java requirements

The server runs on Java 17 or newer. The With JRE installers bundle one; otherwise the machine needs it. The server starts with a 256 MB heap, set in `conf/base_includes.vmoptions`. See [JVM options](./server_configuration.md#jvm-options) for raising it.

### Database requirements

OIE stores configuration and messages in an embedded Apache Derby database by default.

::: warning Derby is not recommended for production
Use one of the databases below for a production server. See [Database Support](./database_support.md) for moving off Derby.
:::

For production deployments, it is recommended to use only database versions currently receiving official security and maintenance support from their respective vendors. The following database engines are supported as backends:

* PostgreSQL
* MySQL
* Oracle 12c or newer
* SQL Server

These requirements govern only the database the server itself stores configuration and messages in. Channels can also read from and write to other databases through the Database Reader and Database Writer. See [Database Support](./database_support.md) for changing the backing database and [Connector Reference](./connector_reference_sources.md#jdbc-drivers-and-url-templates) for the channel-side drivers.

## Download and installation

Every release publishes native installers for Windows, macOS and Linux on the [releases page](https://github.com/OpenIntegrationEngine/engine/releases/latest), plus `.tar.gz` and `.zip` archives for Linux and Windows. The installer installs the application, registers OIE as a native service, and sets it to start on boot. If you would rather do it by hand, see [Installing from an archive](#installing-from-an-archive).

### Choosing an installer

Each platform ships in two flavors.

**With JRE** bundles Eclipse Temurin (Adoptium) JDK 21.0.12.1, so nothing else needs installing.

**Without JRE** is smaller and uses a Java runtime already on the machine. The launchers the installer creates accept Java 17 and newer, with no upper limit. See [Choosing a Java](./server_process_management.md#choosing-a-java) for how they find one. Choose it when Java is managed centrally or already hardened to a standard you have to meet.

The bundled flavor is about 63MB to 67MB larger depending on platform.

Pick the build that matches your architecture: `aarch` for Apple silicon and `x86` for Intel Macs, `x64` or `arm64` on Windows. Each release also publishes `sha256sums` and `md5sums`.

### Installing

Open the file you downloaded:

* **Windows**: run the `.exe`.
* **macOS**: mount the `.dmg` and launch the installer inside it.
* **Linux**: make the `.sh` executable with `chmod +x`, then run it.

Then follow the wizard: accept the Mozilla Public License 2.0, choose an installation directory, and click `Finish`. The installer requires administrative rights, because registering a system service does.

On a headless machine the installer detects that no display is available and runs as a console installer instead.

::: warning Your operating system will warn about the installer
Windows and macOS check downloaded programs for a code signature. The OIE installer does not have one, so you will see a security warning.

On Windows the warning comes from SmartScreen, and often from the browser as well. On macOS, Gatekeeper blocks the `.dmg` the first time you open it. Allow it under System Settings, Privacy & Security. The wording varies by version.

The Administrator client jars and the bundled extension jars carry a signature from a certificate authority with a trusted timestamp. The server jars, the command line jars and the two launcher jars are not signed by the project.

Check your download against the published `sha256sums` and continue.
:::

::: warning Install directory and sudo
Installing into a directory you do not own, such as the default `/Applications/OpenIntegrationEngine` on macOS, means anything you later run by hand needs `sudo`.
:::

### Installing from an archive

The release also publishes `oie_unix_<version>.tar.gz` and `oie_windows-<arch>_<version>.zip` for a manual install. Unpack the archive wherever you want it and run `oieserver` (`oieserver.exe` on Windows) from the extracted directory. The archives carry no Java, so the machine needs Java 17 or newer. See [Choosing a Java](./server_process_management.md#choosing-a-java).

Nothing is registered with the service manager and nothing starts on boot, so you have to wire it into systemd, launchd or the Windows service manager yourself. This route also works when you cannot give an installer administrative rights.

## Directory layout

After installation and the first start, the directory contains:

```text
OIE_HOME/
├── appdata/                # Application data, created by the server on first start
│   ├── mirthdb/            # Embedded Derby database, when Derby is in use
│   ├── temp/               # java.io.tmpdir for the server, created at startup
│   ├── keystore.jks        # TLS keystore
│   ├── extension.properties        # Installed extension state
│   ├── server.id           # Unique server identifier
│   └── configuration.properties    # Configuration map, created at runtime
├── cli-lib/                # CLI libraries
├── client-lib/             # Administrator client libraries
├── conf/                   # Configuration files
│   ├── mirth.properties            # Main server configuration
│   ├── dbdrivers.xml               # Database driver definitions
│   ├── log4j2.properties           # Logging configuration
│   ├── log4j2-cli.properties       # CLI logging configuration
│   ├── mirth-cli-config.properties # CLI defaults
│   ├── base_includes.vmoptions     # Base JVM options, do not modify
│   ├── custom.vmoptions            # Your JVM options
│   └── default_modules.vmoptions   # Java module system options
├── docs/                   # Licenses and the user API javadocs
├── extensions/             # Connectors and plugins
├── logs/                   # Server log files
├── public_html/            # Web server root
├── public_api_html/        # REST API documentation
├── server-launcher-lib/    # Empty at install, jars placed here join the launcher classpath
├── server-lib/             # Server libraries
├── mirth-server-launcher.jar   # Server launcher JAR
├── mirth-cli-launcher.jar      # CLI launcher JAR
├── oiecommand              # CLI launcher
├── oieserver               # Server launcher, foreground
├── oieservice              # Service launcher, registered with the OS
├── oieserver.vmoptions     # JVM options for the foreground launcher
└── oieservice.vmoptions    # JVM options for the service
```

It also holds others, such as `configure-from-env`, `uninstall`, a hidden `.install4j/` directory, `derby.log` when Derby is in use, and `appdata/exports/` after an events export.

Runtime-created directories such as `appdata/` are kept when the installer runs over an existing installation. See [Upgrade Guide](./upgrade_guide.md) before doing that on a server you care about.

## Next steps

* [Server Process Management](./server_process_management.md) to start it.
* [Accessing the Administrator](./accessing_the_administrator.md) to log in.
* [Database Support](./database_support.md) to move off Derby before production.
* [Migrating from Mirth Connect](./migrating_from_mirth_connect.md) if you are replacing an existing Mirth Connect server.
