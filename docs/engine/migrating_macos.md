---
title: Migrating from Mirth Connect on macOS
description: Not yet written. What a macOS version of the migration procedure needs to cover
---

# Migrating from Mirth Connect on macOS

**This page is not written yet.** Contributions welcome, see [Contributing](./contributing.md).

Read [Migrating from Mirth Connect](./migrating_from_mirth_connect.md) for the part that does
not change with the platform: what OIE keeps from Mirth, what migrates, how extensions are
checked, what the keystore holds, and the backups to take first.

Throughout this page Mirth Connect is installed at `/Applications/Mirth Connect` and OIE at `/Applications/OpenIntegrationEngine`. The OIE path is the documented default, see [Installation](./installation.md). Substitute your own.

[Migrating on Linux](./migrating_linux.md) is the template. The eleven steps are the same.
These steps need macOS equivalents, against the launchd daemon `com.oie.oieservice` defined
in `/Library/LaunchDaemons/com.oie.oieservice.plist`:

- **Step 4**, the account the daemon runs as, set in the plist rather than a systemd drop-in.
- **Steps 5, 7, 10 and 11**, `launchctl` in place of `systemctl` for starting, stopping and
  unloading the daemon, and confirming the process is gone.
- **Step 8**, copying the application data, and the `chown` that has to follow it.

See [Server Process Management](./server_process_management.md) for how the daemon is managed
on macOS.

## What this touches

The tree below lists everything the procedure edits or copies, and the step that does it. See
[Installation](./installation.md) for the full directory listing.

```text
/Applications/OpenIntegrationEngine/
├── appdata/                        # replaced wholesale from Mirth (step 8)
│   ├── keystore.jks
│   ├── server.id
│   ├── configuration.properties
│   ├── extension.properties
│   └── mirthdb/                    # kept on Derby, deleted on an external database (step 8)
├── conf/
│   ├── mirth.properties            # edit (steps 2, 3, 6 and 9)
│   ├── dbdrivers.xml               # copy if you added driver entries (step 6)
│   ├── log4j2.properties           # merge custom appenders (step 6)
│   ├── mirth-cli-config.properties # copy if you customised it (step 6)
│   └── custom.vmoptions            # set JVM settings again, no Mirth equivalent (step 6)
├── custom-lib/                     # copy if you use it, not created by the installer (step 6)
├── extensions/                     # see Extension compatibility (step 6)
└── logs/
    └── mirth.log                   # watch (steps 5 and 10)
```

