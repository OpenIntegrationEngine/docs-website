---
title: Database Support
description: Supported databases and configuration
---

# Database Support

OIE ships with an embedded Apache Derby database. Derby is not recommended for production: use one of the other databases below.

## Supported databases

- **Apache Derby** (embedded, default)
- **PostgreSQL**
- **MySQL**
- **Oracle**
- **SQL Server** (via jTDS or Microsoft driver)

## Changing the database

Database settings live in `conf/mirth.properties`. The key properties are:

- `database`: The database type (`derby`, `postgres`, `mysql`, `oracle`, `sqlserver`)
- `database.url`: JDBC connection URL
- `database.username` / `database.password`: Credentials (not needed for Derby)
- `database.driver`: Override the default JDBC driver class if needed

The properties file lists an example JDBC URL for each supported database in a comment. Copy the one you need into `database.url`, set `database` to match, and set `database.driver` if you use the Microsoft SQL Server driver. The Microsoft driver bundled with 4.7.0 encrypts the connection by default, so it needs a certificate the Java runtime trusts, or `;trustServerCertificate=true` added to `database.url`, which skips certificate validation. Against SQL Server's usual self-signed certificate and without either, the server stops at startup with `PKIX path building failed`.

## Connection pool settings

The properties file also includes settings for connection pool sizing:

- `database.max-connections`: Max connections for read/write operations (default: 20)
- `database-readonly.max-connections`: Max connections for read-only operations (default: 20)

The shipped file turns read-write splitting on (`database.enable-read-write-split = true`), which separates read-only queries onto their own connection pool. Without that key the split is on, and the server writes `database.enable-read-write-split = true` into the file at first start. Without `database-readonly.max-connections` the server writes `database-readonly.max-connections = 20`, so the read-only pool is 20 whatever `database.max-connections` says. By default the read-only pool uses the same connection information as the main pool, but you can point it at a different host (e.g., a read replica) using the `database-readonly.*` properties.

## Startup retry

If the database is unavailable when the server starts, OIE retries the connection according to these properties:

- `database.connection.maxretry`: Number of retry attempts (default: 2)
- `database.connection.retrywaitinmilliseconds`: Wait between retries in ms (default: 10000)

## Database drivers for connectors

The file `conf/dbdrivers.xml` defines the database drivers available in the **Database Reader** and **Database Writer** connectors. These are separate from the server's own database connection. See [Server Configuration](./server_configuration.md) for when the server reads this file.

## Schema and migration

OIE creates and updates its database schema automatically on startup. After an upgrade, check **Settings > Database Tasks** in the Administrator for optional cleanup tasks such as removing old tables from prior versions or adding missing indexes.
