---
title: Building from Source
description: Compiling Open Integration Engine with Gradle, creating the development database, and running the server you just built
---

# Building from Source

This page is for contributors who want to compile the engine and run what they compiled. If you only want a working server, install a published release instead: see [Installation](./installation.md). Nothing here is required to use OIE.

The build is driven by Gradle through a wrapper committed to the repository, so the only thing you have to install yourself is a JDK.

## Prerequisites

### Java

The repository pins the JDK it is built against in [`.sdkmanrc`](https://github.com/OpenIntegrationEngine/engine/blob/main/.sdkmanrc) at the root of the tree. At the time of writing that is a Java 17 Zulu build with JavaFX included, and the JavaFX part matters: the Administrator client will not compile against a plain JDK.

The least error-prone way to get exactly that JDK is [SDKMAN](https://sdkman.io/), which reads the pin for you:

```bash
curl -s "https://get.sdkman.io" | bash
```

Open a new shell afterwards so the `sdk` command is on your path.

### Gradle

You do not install Gradle. The `gradlew` script in the repository root downloads and runs the correct version on first use.

::: tip Windows
Every command below is written as `./gradlew`. On Windows use `gradlew.bat` instead. If the build stops in the javadoc step complaining that a path is too long, add `-x :server:userApiJavadoc` to skip it.
:::

## Get the source

```bash
git clone https://github.com/OpenIntegrationEngine/engine.git
cd engine
```

Then let SDKMAN install and select the pinned JDK. Run this from the repository root, where `.sdkmanrc` lives:

```bash
sdk env install
```

`sdk env install` installs the pinned version if you do not have it and switches the current shell to it. In a new shell, run `sdk env` to switch again without reinstalling. Confirm you got what you expected before building:

```bash
java -version
```

## Build

```bash
./gradlew build -PdisableSigning=true
```

`-PdisableSigning=true` turns off jar signing. Signing is for published releases and needs a key you do not have, so leave it off for local work. It also takes a long time, which you will notice if you forget the flag.

The first run downloads the Gradle distribution and every dependency, so expect several minutes. Later runs are much faster. A successful build ends with `BUILD SUCCESSFUL` and leaves a complete server layout in `server/setup`.

A few other targets are useful once you are working in the tree:

```bash
./gradlew test                  # unit tests only
./gradlew dist                  # distribution extension zips, into server/dist
./gradlew clean build dist      # the full release shape, from scratch
```

::: warning Dependencies are checksum-verified
Versions are pinned in `gradle/libs.versions.toml` and their checksums are recorded. Editing a version means regenerating that metadata, and it has to be done against a cold dependency cache or the result passes locally and fails in CI. [CONTRIBUTING.md](https://github.com/OpenIntegrationEngine/engine/blob/main/CONTRIBUTING.md) has the exact command.
:::

## Create the development database

A fresh tree has no database. Create the embedded Derby one before the first run:

```bash
./gradlew :server:createDerbyDb
```

This is a one-time step. Run it again only after wiping the database.

## Run the server

```bash
./gradlew :server:devLauncher -PdisableSigning=true
```

`devLauncher` starts the server from `server/setup` the same way the production launcher does, which makes it the closest thing to running a real installation out of your working tree. It runs in the foreground and streams the log to your terminal. Stop it with `Ctrl+C`.

You can also run the launcher script from the staged distribution directly, which is the same server started the same way:

```bash
cd server/setup
./oieserver
```

::: warning `:server:devRun` does not currently work
`CONTRIBUTING.md` also lists `:server:devRun`, which runs the server straight from the compiled classes rather than from `server/setup`. On current `main` it fails at startup with `Could not find resource SqlMapConfig.xml` and then retries in a loop, because the `dbconf` directory that holds that file is packaged into the distribution but is not on the task's classpath. This is tracked in [issue #416](https://github.com/OpenIntegrationEngine/engine/issues/416). Use `devLauncher` until it is fixed.
:::

A successful startup ends with lines like these. Versions, addresses and dates will differ:

```log
INFO  [Main Server Thread] com.mirth.connect.server.Mirth: Open Integration Engine 4.6.0 (Built on ...) server successfully started.
INFO  [Main Server Thread] com.mirth.connect.server.Mirth: Running OpenJDK 64-Bit Server VM 17.0.17 on Mac OS X (15.6, aarch64), derby, with charset UTF-8.
INFO  [Main Server Thread] com.mirth.connect.server.Mirth: Web server running at http://<host>:8080/ and https://<host>:8443/
```

::: warning Stop any other engine first
The server binds ports 8080 and 8443. If you already have OIE running as a service, or a container publishing those ports, start nothing until you have stopped it. Two engines on one port produce confusing results rather than a clear error, and you can end up administering the wrong one without noticing.
:::

### First login

Scan the startup log for the initial administrator password. A new database prints it once, in a banner near the top of the output:

```log
WARN  [Main Server Thread] com.mirth.connect.server.Mirth:
********************************************************************************
************   Initial admin password is <generated>            ************
********************************************************************************
```

The username is `admin`. The password is generated per database and is not a fixed default, so copy it from that banner. It is printed only when the database is first initialized; if you have lost it, recreate the database and read the new one.

## Connect to it

Open `https://localhost:8443/` in a browser. The server presents a self-signed certificate, so you will have to accept a warning the first time. You should land on the engine's home page, which links to the Administrator launcher and the client API.

From there, [Accessing the Administrator](./accessing_the_administrator.md) covers the browser-based administrator and the desktop Administrator launchers, including [Ballista](https://github.com/kayyagari/ballista/releases).

The Gradle build also exposes `:client:devClient`, which launches the desktop Administrator from the tree you just compiled. It connects to `https://localhost:8443` and will only reach the server you intended if nothing else is bound to that port.

## What is in the tree

The repository is a multi-module Gradle build. The modules, as declared in `settings.gradle`:

| Directory | What it is |
| --- | --- |
| `server` | The engine itself: server source, the core jars, and the staged distribution under `server/setup`. |
| `client` | The Swing Administrator client and the client half of each bundled extension. |
| `donkey` | The message engine underneath the server. |
| `command` | The command line client. |
| `generator` | HL7 vocabulary generator tooling. Not part of the distribution build. |
| `smoketest` | Integration tests that run against a live server, not unit tests. |

Two directories outside the module list are worth knowing: `gradle` holds the version catalog and dependency verification metadata, and `ci` holds the scripts the pipelines run.

## Working in an IDE

Import the repository as a Gradle project. IntelliJ IDEA handles this natively; Eclipse does it through Buildship. The old `.classpath` and `.project` files were removed deliberately, so do not go looking for them.

To attach a debugger, add `--debug-jvm` to any of the run targets. The JVM suspends at startup and waits for a connection on port 5005.

---

The build and run steps on this page were reconstructed from the walkthroughs [@mgaffigan](https://github.com/mgaffigan) and [@VillePekka](https://github.com/VillePekka) contributed to [issue #118](https://github.com/OpenIntegrationEngine/engine/issues/118), updated for the Gradle build that replaced Ant.
