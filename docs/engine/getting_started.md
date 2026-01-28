---
title: Open Integration Engine getting started
description: First step to install on Windows and MacOS X and proceed to the first launch
author: Christophe Chauvet
---

# Getting started

To quickly start with Open Integration Engine™️, also called OIE™️ in this documentation, 
you can use the different installers available on Windows, Mac OS and Linux platforms.

::: tip INFORMATION

All installers are available at the releases page on GitHub, see [GitHub Releases](https://github.com/OpenIntegrationEngine/engine/releases)

The installers are available in 2 flavors:

* With Java Runtime Environment (JRE) 
* Without JRE
:::

## System requirements

The OIE Server operates as a completely self-contained application and does not depend on any external application server.

### Java requirements

The Open Integration Engine requires Java 17+ to work.

### Database requirements

OIE uses an embedded Apache with the Derby database by default, which allows you to store configuration and messages, for the purpose of rapid deployment, development and testing.

For production deployments, it is recommended to use only database versions currently receiving official security and maintenance support from their respective vendors. The following database engines are supported as backends:

* PostgreSQL
* MySQL
* MariaDB
* Oracle
* SQL Server

## Download and installation

You can download the latest version of Open Integration Engine for your platform at this 
[address](https://github.com/OpenIntegrationEngine/engine/releases/latest).

### Windows

::: info
Add Screenshots for windows Installation

Wizard screenshots are similar to Mac OS part
:::

### Mac OS

![Mac OS Installer Package](images/gs_macos_installer-package.png "Mac OS Installer Package")

Double-click to launch the Open Integration Engine Installer

![OIE Installer Welcome Screen](images/gs_macos_install_step_1.png "OIE Installer Welcome Screen")

The welcome screen just resumes the information, just click on `Next`

![OIE Installer License Screen](images/gs_macos_install_step_2.png "OIE Installer License Screen")

This screen displays the license, to continue you must accept this license by check `I accept the agreement`
and after click on `Next`

![](images/gs_macos_install_step_3.png)

Read this screen information and click on `Next`to continue.

![](images/gs_macos_install_step_4.png)

You can choose another folder if you do not want to install as global package.

::: warning
If you let the default application folder, to launch the oie server, you need to use `sudo` command.
:::

And click on `Next` to start the installation.

![](images/gs_macos_install_step_5.png)

You can display the progress of the installation with this screen

![OIE Installer Summary](images/gs_macos_install_step_6.png "OIE Installer Summary")

This is the final screen of the installer, just click on Finish to close the installer wizard.

Now, open a Terminal and start the OIE server

```shell
sudo /Applications/OpenIntegrationEngine/oieserver
```

During the first launch, the server initializes the database. If the server is launched correctly, you should see the following lines:

```shell
INFO  2026-01-15 20:07:38.773 [Main Server Thread] com.mirth.connect.server.Mirth: Open Integration Engine 4.5.2 (Built on July 8, 2025) server successfully started.
INFO  2026-01-15 20:07:38.776 [Main Server Thread] com.mirth.connect.server.Mirth: This product was developed by NextGen Healthcare (https://www.nextgen.com) and its contributors (c)2005-2024.
INFO  2026-01-15 20:07:38.776 [Main Server Thread] com.mirth.connect.server.Mirth: Open Integration Engine contributors (c)2025.
INFO  2026-01-15 20:07:38.777 [Main Server Thread] com.mirth.connect.server.Mirth: Running OpenJDK 64-Bit Server VM 17.0.15 on Mac OS X (15.7.3, aarch64), derby, with charset UTF-8.
INFO  2026-01-15 20:07:38.778 [Main Server Thread] com.mirth.connect.server.Mirth: Web server running at http://192.168.1.X:8080/ and https://192.168.1.X:8443/
```

::: tip
Please note these URLs, as we will need them later.
:::

## First launch

To verify if the OIE server is available, open your web browser and enter the URL previously noted.

After confirmed to accept self signed certificate, you will see this page

![OIE Server Welcome Page](images/gs_web_browser_step_1.png "OIE Server Welcome Page")

Copy the Administrator Launcher URL

### Ballista

[Ballista](https://github.com/kayyagari/ballista/releases) is an open-source Administrator launcher for Open Integration Engine based on Tauri.

### MCAL

The original Mirth® Connect Administrator Launcher by NextGen Healthcare works with OIE. Here is how you can use it to launch the OIE Administrator client GUI application.

Go to the Mac Os Launcher and search Mirth, you will see this icon.

![MCAL MacOS Launcher](images/gs_launcher_mcal.png "MCAL MacOS Launcher")

If it's the first launch, the left panel with connections is empty

![MCAL Connections](images/gs_mcal_step_1.png "MCAL Connections")

To work better with OIE, choose `Bundled Java 17`

And just click on `Launch` at the top right screen.

You should see a progress bar that will load the files necessary to launch the Open Integration Engine client.

![OIE Login Screen](images/gs_oie_login_step_1.png "OIE Login Screen")

::: warning

If you use a new instance, the default credentials are:

* login: **admin**
* password: **admin**
:::

After entering your credentials, click on `Login` button.

![](images/gs_oie_login_step_2.png)

After some time, you will see the OIE dashboard.

Now it asks to change the default password

![](images/gs_oie_credential_update_step_1.png)

Fill the information, and don't forget to set the `New Password` ( 2 times)

And click on `Finish`

![](images/gs_oie_dashboard.png)

It's finished, Now you can start to use your OIE server.