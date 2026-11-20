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

Before opening a download, read [Installer signing and security warnings](#installer-signing-and-security-warnings) and verify its checksum.

Open the file you downloaded:

* **Windows**: run the `.exe`.
* **macOS**: mount the `.dmg` and launch the installer inside it.
* **Linux**: make the `.sh` executable with `chmod +x`, then run it.

Then follow the wizard: accept the Mozilla Public License 2.0, choose an installation directory, and click `Finish`. The installer requires administrative rights, because registering a system service does.

On a headless machine the installer detects that no display is available and runs as a console installer instead.

::: warning Install directory and sudo
Installing into a directory you do not own, such as the default `/Applications/OpenIntegrationEngine` on macOS, means anything you later run by hand needs `sudo`.
:::

### Installer signing and security warnings

Windows and macOS check downloaded programs for a code signature. The project states that the OIE installer does not have one, so you will see a security warning. A signed Java jar inside the installer does not give the installer a Windows publisher signature, an Apple Developer ID signature, or Apple notarization.

For OIE 4.7.0, the checked-in [install4j configuration](https://github.com/OpenIntegrationEngine/engine/blob/v4.7.0/tools/install4j/oie-installer-config.install4j) contains no native code-signing or notarization configuration. The [Gradle signing task](https://github.com/OpenIntegrationEngine/engine/blob/v4.7.0/server/build.gradle#L726-L839) targets the Administrator client and extension jars. The server jars, the command line jars and the two launcher jars are not signed by the project. The task supports certificate-authority and self-signed certificates; the `-PdisableSigning=true` option in [Building from Source](./building_from_source.md) skips that jar-signing task for local builds.

These build settings describe the source configuration, not a verification of the signatures or notarization of each published installer. Do not infer an official release's signing status from a locally built copy or from a security warning alone.

#### Verify the download

Download the installer and `sha256sums` from the same version on the [official releases page](https://github.com/OpenIntegrationEngine/engine/releases). Check the exact filename, including architecture and whether it includes a JRE. Compute its SHA-256 hash without opening it, using the appropriate command below and replacing the example filename with yours.

**Windows (PowerShell):**

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath '.\oie_windows-x64_4_7_0-with-JRE.exe'
```

**macOS (Terminal):**

```bash
shasum -a 256 'oie_macos_4_7_0-aarch-with-JRE.dmg'
```

**Linux (`.sh` or `.tar.gz`):**

```bash
sha256sum 'oie_unix_4_7_0-with-JRE.sh'
# or check every downloaded file that is listed in sha256sums:
sha256sum -c --ignore-missing sha256sums
```

Compare all 64 hexadecimal characters with the entry for that filename in `sha256sums` (the `*` before the filename marks binary mode; letter case does not matter). A match confirms agreement with the published checksum; it does not establish publisher identity, notarization, or that software is safe. If the hash differs, stop and download the file again from the official release. Do not run it while the mismatch remains unexplained.

#### Windows SmartScreen

SmartScreen considers both publisher and file reputation. An unsigned installer or a newly released signed file can trigger a warning such as **Windows protected your PC**; the browser may also warn that a download is uncommon. A reputation warning alone does not establish that the file is malicious or that it is safe. See [Microsoft's explanation of SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation).

Verify the source and checksum before deciding whether to proceed. On a managed computer, ask your administrator to review the installer through your organization's software approval process. Policy or Windows Smart App Control may prevent it from running. Do not turn off SmartScreen, Smart App Control, or antivirus protection to install OIE. Treat a malware detection as a reason to stop and investigate, not as an ordinary reputation warning.

#### macOS Gatekeeper

Gatekeeper checks software downloaded outside the App Store for an identified developer and Apple notarization. A warning about an unidentified developer or an app that Apple cannot check for malicious software can appear when you open the disk image or the installer inside it; wording varies by macOS version. Notarization is a separate Apple check, not the same as signing the Java jars.

After verifying the source and checksum, consult [Apple's guidance on safely opening apps](https://support.apple.com/en-us/102445) to understand the warning and the conditions for an app-specific exception. On a managed Mac, ask your administrator to review it. Keep Gatekeeper enabled and do not remove quarantine attributes to suppress the checks. If macOS says the app will damage your computer, contains malware, or is damaged, stop and investigate instead of treating that as an unidentified-developer warning.

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
