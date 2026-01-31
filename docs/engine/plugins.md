# OIE Plugin Guide

Plugins extend the functionality of Open Integration Engine (OIE), allowing you to add custom features, connectors, and capabilities. This guide covers everything you need to know about installing, managing, and troubleshooting plugins.  Resources are provided for developing custom plugins.

## Overview

Open Integration Engine supports a plugin architecture that enables:

- Custom connectors and protocols
- Extended transformers and filters
- Additional data types and formats
- Custom UI components in the Administrator

## Accessing the Extensions/Plugins Section

To manage plugins in Open Integration Engine:

1. Open the **OIE Administrator** application
2. Navigate to **Settings** from the main menu
3. Select **Extensions** from the left sidebar
4. You will see a list of all installed plugins along with their status and other details.

## Installing Plugins

### Installing via the Administrator UI

The easiest way to install a plugin is through the Administrator interface:

1. Download the plugin `.zip` file from a trusted source
2. Open the **OIE Administrator** and navigate to **Settings** → **Extensions**
3. Click the **Install Extension** button
4. Browse to and select the plugin `.zip` file
5. Click **Open** to begin the installation
6. Review the plugin information and click **Install**
7. **Restart** the OIE Server for the plugin to take effect

::: info
Always restart the OIE Server after installing or uninstalling plugins to ensure changes take effect.
:::

### Manual Installation

For environments where UI-based installation is not feasible, you can install plugins manually:

1. Stop the OIE Server
2. Extract the plugin `.zip` file
3. Copy the extracted plugin folder to the `extensions/` directory in your OIE installation:
   ::: code-group
   ```bash [Linux/macOS]
   cp -r my-plugin /opt/oie/extensions/
   ```
   ```powershell [Windows]
   Copy-Item -Recurse my-plugin "C:\Program Files\OIE\extensions\"
   ```
   :::
4. **(Linux/macOS only)** Ensure proper file permissions so the OIE process can read the plugin files. The plugin files should be owned by the same user that runs OIE:
   ::: code-group
   ```bash [Linux/macOS]
   # Replace 'oie' with the user account that runs the OIE Server
   chown -R oie:oie /opt/oie/extensions/my-plugin
   ```
   :::
   ::: tip
   OIE does not create a dedicated system user during installation. It runs as the user who starts the service. Check which user owns your OIE installation directory or runs the OIE process.
   :::
5. Start the OIE Server

### Installing in the OIE Docker Container

When running OIE in a Docker container, you have several options for installing plugins:

#### Example 1: Docker CLI with `custom-extensions` Volume Mount

Mount a host directory containing plugin zip files to the container's `custom-extensions` directory. The container's entrypoint script will unzip and install them to the `extensions` directory prior to launching the server:

```bash
docker run -d \
  -v /path/to/local/custom-extensions:/opt/engine/custom-extensions \
  openintegrationengine/engine:latest
```

#### Example 2: Custom Dockerfile with manual installation

Create a custom Docker image with plugins pre-installed:

::: code-group
```dockerfile [Dockerfile]
FROM openintegrationengine/engine:latest

COPY my-plugin.zip /tmp/
RUN unzip /tmp/my-plugin.zip -d /opt/engine/extensions/ && \
    rm /tmp/my-plugin.zip
```
:::

Build and run:

```bash
docker build -t oie-with-plugins .
docker run -d oie-with-plugins
```

#### Example 3: Docker Compose with `EXTENSIONS_DOWNLOAD` URL

The container supports downloading a bundle of extensions from a remote web server and installing them prior to launching the server. The bundle file is a zip file that contains one or more extension zip files to be installed:

::: code-group
```yaml [compose.yaml]
version: '3.8'
services:
  oie:
    image: openintegrationengine/engine:latest
    environment:
      - EXTENSIONS_DOWNLOAD=https://my-bucket.s3.us-east-1.amazonaws.com/my-oie-extensions-bundle.zip
    ports:
      - "8080:8080"
      - "8443:8443"
```
:::

## Uninstalling Plugins

### Via the Administrator UI

1. Navigate to **Settings** → **Extensions**
2. Locate the plugin you want to remove
3. Click the **Uninstall** button next to the plugin
4. Confirm the uninstallation when prompted
5. **Restart** the OIE Server

### Manual Uninstallation

1. Stop the OIE Server
2. Navigate to the `extensions/` directory
3. Remove the plugin folder:
   ::: code-group
   ```bash [Linux/macOS]
   rm -rf /opt/oie/extensions/my-plugin
   ```
   ```powershell [Windows]
   Remove-Item -Recurse -Force "C:\Program Files\OIE\extensions\my-plugin"
   ```
   :::
4. Start the OIE Server

## Enabling and Disabling Plugins

You can temporarily disable plugins without uninstalling them:

### To Disable a Plugin

1. Navigate to **Settings** → **Extensions**
2. Find the plugin in the list
3. Toggle the **Enabled** switch to **Off**
4. **Restart** the OIE Server

### To Enable a Plugin

1. Navigate to **Settings** → **Extensions**
2. Find the disabled plugin in the list
3. Toggle the **Enabled** switch to **On**
4. **Restart** the OIE Server

::: tip
Disabling plugins is useful for troubleshooting. If you suspect a plugin is causing issues, disable it and restart the server to confirm.
:::

## Plugin Compatibility and Version Requirements

### Checking Compatibility

Before installing a plugin, verify:

1. **OIE Version**: Check the plugin documentation for supported OIE versions
2. **Java Version**: Some plugins may require specific Java versions
3. **Dependencies**: Review any additional dependencies the plugin requires

::: info
Plugin authors must specify compatible versions in their plugin. Currently, plugins cannot support a range of versions.
:::

## Troubleshooting Common Issues

### Plugin Not Appearing After Installation

**Possible causes and solutions:**

1. **Server not restarted**: Restart the OIE Server after installation
2. **Incorrect directory**: Verify the plugin is in the correct `extensions/` folder
3. **File permissions**: Ensure the OIE process has read access to the plugin files
4. **Corrupted archive**: Re-download and reinstall the plugin

### Plugin Causing Server Startup Failures

If the server fails to start after installing a plugin:

1. Check the server logs in `logs/oie-server.log` for error messages
2. Try starting the server with the plugin disabled:
   ::: code-group
   ```bash [Linux/macOS]
   # Temporarily move the plugin out of extensions
   mv /opt/oie/extensions/problem-plugin /tmp/
   ```
   ```powershell [Windows]
   # Temporarily move the plugin out of extensions
   Move-Item "C:\Program Files\OIE\extensions\problem-plugin" "C:\Temp\"
   ```
   :::
3. If the server starts successfully, the plugin is likely incompatible

### Plugin Features Not Working

1. Verify the plugin is **enabled** in Settings → Extensions
2. Check for JavaScript console errors in the Administrator
3. Review server logs for runtime errors
4. Ensure all plugin dependencies are installed

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ClassNotFoundException` | Missing dependency | Install required dependencies |
| `NoSuchMethodError` | Version mismatch | Use compatible plugin version |
| `SecurityException` | Permission denied | Check file permissions |

## Plugin Development Resources

For those interested in developing plugins for Open Integration Engine:

### Key Resources

- **Plugin Author's Guide**: [mirth-plugin-guide](https://github.com/kpalang/mirth-plugin-guide) - Comprehensive guide for plugin development on OIE, Mirth Connect (Open Source Versions) and BridgeLink.
- **Sample Plugin**: [mirth-sample-plugin](https://github.com/kpalang/mirth-sample-plugin) - A working example plugin to use as a template for OIE, Mirth Connect (Open Source Versions) and BridgeLink.

## Best Practices

1. **Always backup** your OIE configuration before installing new plugins
2. **Test in non-production** environments first
3. **Keep plugins updated** to receive bug fixes and security patches
4. **Review plugin source code** when possible, especially for plugins handling sensitive data
5. **Document installed plugins** for your team and disaster recovery procedures
6. **Monitor server logs** after installing new plugins for any issues

## See Also

- [Contributing to Open Integration Engine](./contributing.md)
- [OIE Docker Hub](https://hub.docker.com/u/openintegrationengine)
- [OIE GitHub Repository](https://github.com/OpenIntegrationEngine/engine)
