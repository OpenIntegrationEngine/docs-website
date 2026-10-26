---
title: Web Administrator
description: What the browser-based administrator is, and where its documentation lives
---

# Web Administrator

OIE can be administered from a browser. The web administrator is a read/write client.

It is a separate application that connects to a running engine. It runs on its own under Node.js or Docker, or as a WAR deployed into the engine, in which case the engine's own web server serves it on the engine's existing port, behind the same credentials. It works against the same REST API as the desktop Administrator, so both can be pointed at one engine at the same time. It is open source under MPL 2.0.

The **Web Support** extension is optional. Without it the web administrator works as a client of the engine's REST API. Installing it adds message-tree serialization, engine-side JavaScript validation, plugin interfaces served by the engine, and an embedded WAR. It installs like any other extension (see the [Plugin Guide](./plugins.md)).

::: info
The web client's README gives OIE 4.6.0 as its minimum engine version.
:::

With the WAR deployed into the engine, browse to `https://<host>:8443/oie-webadmin/`.

## Documentation

The web administrator is developed outside the engine repository, and its documentation is in its own repositories:

[gibson9583/oie-web-client](https://github.com/gibson9583/oie-web-client) holds the administrator itself: what it covers, and standalone Node.js, Docker, and [WAR](https://github.com/gibson9583/oie-web-client#deploy-into-an-existing-oie-server-war) deployment. [gibson9583/oie-web-support-plugin](https://github.com/gibson9583/oie-web-support-plugin) holds the optional Web Support extension, its releases, and its installation notes. For writing a web interface for an extension, and the extension points available to it, see [PLUGINS.md](https://github.com/gibson9583/oie-web-client/blob/main/web-administrator/PLUGINS.md).

## Related pages

- [Accessing the Administrator](./accessing_the_administrator.md)
- [Desktop Administrator](./desktop_administrator.md)
- [Plugin Guide](./plugins.md)
