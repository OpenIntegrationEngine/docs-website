---
title: Migrating from Mirth Connect on Linux
description: The eleven-step cutover on Linux, with systemd and file ownership
---

# Migrating from Mirth Connect on Linux

Read [Migrating from Mirth Connect](./migrating_from_mirth_connect.md) first. It covers what
changes, what migrates, how extensions are checked, what the keystore holds, and the backups
to take before you start.

Throughout this page Mirth Connect is installed at `/opt/mirth` and OIE at `/opt/oie`.
Substitute your own locations.

OIE creates `appdata/` inside `/opt/oie` when it first starts. Its location comes from `dir.appdata`,
which ships as a path relative to the installation, so check that property on the Mirth
side before copying anything out of `/opt/mirth/appdata/`.

## What this touches

The tree below lists everything the procedure edits or copies, and the step that does it. See
[Installation](./installation.md) for the full directory listing.

```text
/opt/oie/
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

## 1. Install OIE, and do not start it

Run the installer with the bundled JRE, choosing a directory separate from the Mirth installation. Do not let the installer start the service. If it starts the service anyway, stop the service before going further.

Nothing in the engine prevents two servers from attaching to one database. Each one deploys whatever it finds.

## 2. Change the ports

OIE ships the same `http.port = 8080` and `https.port = 8443` as Mirth, and the installer never prompts for them. Edit `/opt/oie/conf/mirth.properties` and set both to values nothing else on the host is using. `http.host` and `https.host` both ship as `0.0.0.0` if you also want to narrow the interface.

These are the server's own administrator and API ports. Channel connector ports are stored in the channels themselves, which live in the database, so this setting does not move them. Step 3 is what keeps those from binding.

## 3. Turn off startup deploy

In `/opt/oie/conf/mirth.properties`:

```properties
server.startupdeploy = false
```

The shipped default is `true`. With it on, the server deploys every channel in the database at startup, and starting a channel binds its connector ports. If OIE starts against your production database while Mirth is still running, both servers try to bind the same connector ports.

## 4. Set the service account and file ownership

The install4j configuration sets no service account, so the service runs as root on Linux. See [Security Posture and Hardening](./security_posture_and_hardening.md) for why a production host should not leave it that way.

Check what the installer generated before overriding it:

```bash
systemctl cat oieservice
```

Create the `oie` account:

```bash
sudo useradd --system --home-dir /opt/oie --shell /usr/sbin/nologin oie
```

Then set the account with a drop-in and reload:

```bash
sudo systemctl edit oieservice
```

```ini
[Service]
User=oie
Group=oie
```

```bash
sudo systemctl daemon-reload
sudo chown -R oie:oie /opt/oie
```

The whole install tree needs to be writable by that account. All of these are written while the server runs, relative to `/opt/oie`:

| Path | When |
|---|---|
| `conf/mirth.properties` | Saved on every boot |
| `conf/log4j2.properties` | Rewritten if a legacy `dir.logs` property is present |
| `appdata/keystore.jks` | Rewritten on every boot |
| `appdata/server.id` | Created on first boot |
| `appdata/configuration.properties` | Written when the configuration map changes |
| `appdata/extension.properties` | Created if absent, and rewritten on every boot |
| `appdata/temp` | Created at startup and set as `java.io.tmpdir` |
| `logs/` | `mirth.log` and its rotated archives |
| `extensions/` | Pending installs and uninstalls are applied at startup |

## 5. Start OIE, then stop it

Start the service and confirm it comes up. Nothing has moved across from the Mirth engine yet, so OIE runs on the shipped configuration: an empty embedded Derby database it creates inside its own `appdata/`, on the ports you set in step 2.

```bash
sudo systemctl start oieservice
sudo tail -f /opt/oie/logs/mirth.log
```

Log in to the Administrator on the port you set in step 2, as `admin` with the password the server wrote to `/opt/oie/logs/mirth.log` (see [Initial admin password](./accessing_the_administrator.md#initial-admin-password)). This tests the install, the bundled JRE, the service account and the file ownership while Mirth is still running and its data has not been touched.

Stop the service before going on.

Everything this step wrote into `/opt/oie/appdata/` is scratch, and step 8 deletes the directory outright. That includes the keystore it generated. Creating a keystore also replaces the shipped default `keystore.storepass` and `keystore.keypass` in `/opt/oie/conf/mirth.properties` with fresh random values, which is why the next step has to bring Mirth's across: they are the passwords to Mirth's keystore, and that is the keystore you end up with. Because the shipped database is Derby, this start also appends `;upgrade=true` to `database.url` in the same file.

## 6. Merge the configuration files

With OIE stopped and Mirth still running, bring the configuration across. Merge property by property. Do not replace whole files, for the reason given under [What migrates](./migrating_from_mirth_connect.md#what-migrates).

**From `/opt/mirth/conf/mirth.properties`:**

- `keystore.storepass` and `keystore.keypass`, which must match the keystore step 8 copies over
- **On an external database**, the `database.*` block: `database`, `database.url`, `database.username`, `database.password`, and the connection pool and retry settings if you tuned them
- **On Derby**, leave `database` and `database.url` at OIE's shipped values. They already point at `${dir.appdata}/mirthdb`, which is exactly where step 8 puts Mirth's database
- `configurationmap.path` if you moved it off the default
- `server.includecustomlib` if you set it to `true`, since OIE ships it as `false`
- Leave `http.port` and `https.port` at your step 2 values for now
- Leave `server.startupdeploy` at `false`
- Leave `version` alone
- Leave `dir.appdata` alone. OIE reads its own `appdata/`, which step 8 fills with a copy of Mirth's. Pointing it at Mirth's directory would leave both servers sharing one

**Also from `/opt/mirth/conf/`:** `dbdrivers.xml` if you added driver entries, `mirth-cli-config.properties` if you customised it, and any custom appenders in `log4j2.properties`. JVM settings such as heap size have no matching path to copy from. OIE splits them into an include chain that Mirth does not have, so set yours again in `/opt/oie/conf/custom.vmoptions`, which is included last and so wins over the defaults. Do not put them in `base_includes.vmoptions`, the shipped base options.

**Outside `conf/`:** `/opt/mirth/extensions/` and `/opt/mirth/custom-lib/`. Copy only the extensions you added yourself into `/opt/oie/extensions/`, not the ones Mirth bundles: copying all of Mirth's `extensions/` puts Mirth's copies of the bundled extensions over OIE's, and the server fails to start. Check each one against [Extension compatibility](./migrating_from_mirth_connect.md#extension-compatibility). Premium extensions do not come across. Copy `custom-lib/` if you use it, and check `server.includecustomlib`, because jars there are not on the classpath when it is `false`.

## 7. Stop Mirth

Stop the Mirth service and confirm the process is gone. That covers every port it held,
the channel connector ports as well as the administrator ones.

```bash
sudo systemctl stop mcservice
systemctl is-active mcservice
pgrep -af /opt/mirth
```

`pgrep` matches on the install path because a pattern such as `MirthLauncher` matches both servers: their launcher classes are `MirthLauncher_mcservice` for Mirth and `MirthLauncher_oieservice` for OIE. Nothing should be printed.

On Derby this is what makes the database safe to copy, because a Derby database has to be
cleanly shut down before it can be copied. On an external database it is what keeps two
servers off the same data.

## 8. Copy the application data

Replace OIE's `appdata/` with Mirth's. Delete OIE's first: step 5 created one, and copying
into it would nest Mirth's directory inside it as `appdata/appdata/` and leave OIE's generated files in place.

```bash
sudo rm -rf /opt/oie/appdata
sudo cp -rp /opt/mirth/appdata /opt/oie/appdata
sudo chown -R oie:oie /opt/oie/appdata
```

`cp -p` preserves Mirth's ownership, so the chown from step 4 has to run again. Without it
OIE cannot rewrite `keystore.jks` on boot and logs `Could not initialize security settings.` On Derby it then cannot write the root-owned database either, logs `Error establishing connection to database, aborting startup`, and exits.

On Derby you are done: `appdata/mirthdb/` is your database and it has just come across with
everything else. On an external database, delete it.

```bash
sudo rm -rf /opt/oie/appdata/mirthdb
```

::: warning Do not leave a copied mirthdb on an external database
If the `database.*` block was never merged in step 6, `database.url` still points at `${dir.appdata}/mirthdb`, so OIE starts on this copy of your
Mirth data and looks healthy: channels present, messages there, statistics populated. Your
real database sits untouched and nothing processes. With the directory deleted, OIE creates a new,
empty database there instead, and the checks in step 10 catch it.
:::

## 9. Put the ports back

Set `http.port` and `https.port` in `/opt/oie/conf/mirth.properties` to the values Mirth was serving on, if you want the Administrator and the API where your users and scripts expect them. Skip this if you have decided to leave OIE on the new ports.

## 10. Start OIE, then deploy

Start the service and watch the log. This is where the server checks the recorded schema version and migrates if it needs to, as described under [What migrates](./migrating_from_mirth_connect.md#what-migrates).

On Derby, `database.url` carries the `;upgrade=true` that step 5 appended. The Derby version shipped here has not changed since long before the fork, so nothing is upgraded.

Check before deploying anything:

- No `Could not initialize security settings.` in `/opt/oie/logs/mirth.log`
- You can log in, and your users exist
- Your channels are present, and the extensions you need are loaded

Then deploy channels a few at a time. Once they are all deployed and processing, set `server.startupdeploy` back to `true` if you want channels deployed automatically, and restart the service to confirm that startup path works before you rely on it at the next reboot.

## 11. Disable the Mirth installation

Stopping the service in step 7 did not stop it starting again. Disable it, so that a reboot
does not bring Mirth up alongside OIE competing for the same database and the same connector
ports.

```bash
sudo systemctl disable mcservice
sudo systemctl is-enabled mcservice
```

Leave the files in place until you are satisfied with the new server. Going back to Mirth
needs them as well as the database backup. When you no longer want them, archive them off the
host.
