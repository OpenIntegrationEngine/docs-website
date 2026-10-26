---
title: Migrating from Mirth Connect on Windows
description: Not yet written. What a Windows version of the migration procedure needs to cover
---

# Migrating from Mirth Connect on Windows

**This page is not written yet.** Contributions welcome, see [Contributing](./contributing.md).

Read [Migrating from Mirth Connect](./migrating_from_mirth_connect.md) for the part that does
not change with the platform: what OIE keeps from Mirth, what migrates, how extensions are
checked, what the keystore holds, and the backups to take first.

Throughout this page Mirth Connect is installed at `C:\mirth` and OIE at `C:\oie`. Neither is a documented default; the installer asks you to choose. Substitute your own.

[Migrating on Linux](./migrating_linux.md) is the template. The eleven steps are the same.
These steps need Windows equivalents:

- **Step 4**, the account the service runs as. The service appears in the Services manager
  (`services.msc`) as **Open Integration Engine Service**. File ownership and permissions on
  the install tree take the place of `chown`.
- **Steps 5, 7, 10 and 11**, starting, stopping and disabling the service, and confirming the
  process is gone.
- **Step 8**, copying the application data, and preserving or resetting its permissions
  afterwards.

See [Server Process Management](./server_process_management.md) for how the service is managed
on Windows.

## What this touches

The tree below lists everything the procedure edits or copies, and the step that does it. See
[Installation](./installation.md) for the full directory listing.

```text
C:\oie\
├── appdata\                        # replaced wholesale from Mirth (step 8)
│   ├── keystore.jks
│   ├── server.id
│   ├── configuration.properties
│   ├── extension.properties
│   └── mirthdb\                    # kept on Derby, deleted on an external database (step 8)
├── conf\
│   ├── mirth.properties            # edit (steps 2, 3, 6 and 9)
│   ├── dbdrivers.xml               # copy if you added driver entries (step 6)
│   ├── log4j2.properties           # merge custom appenders (step 6)
│   ├── mirth-cli-config.properties # copy if you customised it (step 6)
│   └── custom.vmoptions            # set JVM settings again, no Mirth equivalent (step 6)
├── custom-lib\                     # copy if you use it, not created by the installer (step 6)
├── extensions\                     # see Extension compatibility (step 6)
└── logs\
    └── mirth.log                   # watch (steps 5 and 10)
```

