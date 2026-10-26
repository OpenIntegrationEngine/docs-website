---
title: REST API
description: Server API endpoints
---

# REST API

OIE exposes a REST API, the one the desktop Administrator, the Web Administrator, and the CLI use. The engine serves its own endpoint reference; see [Swagger / OpenAPI](#swagger-openapi).

## Base URL

```text
https://<host>:8443/api
```

The port comes from `https.port` and the prefix before `/api` from `http.contextpath`, both in `mirth.properties`; the defaults are shown. The API is served over HTTPS, and every request must be authenticated except `/api/server/version`, `/api/server/status`, and the API documentation (see [API documentation](#api-documentation)). Requests must also carry an `X-Requested-With` header for CSRF protection, the Swagger UI page itself excepted; any non-blank value is accepted (`server.api.require-requested-with`, default `true`).

## Authentication

### Session-based
1. POST a form body (`application/x-www-form-urlencoded`) with `username` and `password` fields to `/api/users/_login`
2. Send the `JSESSIONID` cookie from the response on subsequent requests

### HTTP headers
| Header | Required | Description |
|---|---|---|
| `X-Requested-With` | Yes (by default) | CSRF protection header (any value) |
| `Authorization` | If no session | HTTP Basic (`username:password`) |
| `Content-Type` | For POST/PUT | `application/xml` or `application/json` for the object endpoints. Login takes `application/x-www-form-urlencoded`, posting a message to a channel takes `text/plain`, and installing an extension takes `multipart/form-data` |
| `Accept` | Optional | `application/xml` (the default) or `application/json` |

### Example (curl)

Lists every channel the account in `-u` can see, with HTTP Basic authentication, and returns the channel definitions as JSON. Any non-blank `X-Requested-With` value passes the CSRF filter, and `-k` skips verification of the certificate the server generates for itself. Without the `Accept` header the response is XML.

```bash
curl -k \
  -H "X-Requested-With: OIE" \
  -H "Accept: application/json" \
  -u '<username>:<password>' \
  https://localhost:8443/api/channels
```

## API documentation

### Swagger / OpenAPI

The API base URL, opened in a browser, serves the Swagger UI:
```text
https://<host>:8443/api
```

The OpenAPI spec is available in JSON and YAML formats at `/api/openapi.json` and `/api/openapi.yaml`. Both live inside the API context, so they need the `X-Requested-With` header but no login:

```bash
curl -k -H "X-Requested-With: OIE" https://localhost:8443/api/openapi.json
```

The Swagger UI includes parameter descriptions, request/response schemas, and example payloads.

### User API Javadocs

Generated Javadocs for the User API (classes available in channel scripts) are served at:
```text
https://<host>:8443/javadocs/user-api/
```

`/javadocs/` on its own is a directory listing of the installation's `docs/javadocs` folder, with `user-api/` as its entry.

## Error handling

The API returns these HTTP status codes:

| Code | Meaning |
|---|---|
| `200` | Success |
| `204` | Success with no content; also returned for a channel or message ID that does not exist |
| `400` | The `X-Requested-With` header is missing or blank |
| `401` | Unauthorized (no session and no valid credentials) |
| `403` | Forbidden. Only an authorization extension, such as Role Based Access Control, returns it; the stock engine lets every user make every call |
| `404` | Not found; also returned for a path or query value of the wrong type, such as a non-numeric message ID |
| `405` | The path does not accept that HTTP method |
| `406` | The `Accept` header names a type the call cannot produce |
| `415` | The request body's `Content-Type` is not one the call accepts |
| `500` | Internal server error; also returned for a request body that cannot be parsed |
| `503` | Server still starting or otherwise unavailable |

A `500` comes back as an HTML error page reading `Request failed.` when the request sends no `Accept` header, and as a JSON error object when it sends `Accept: application/json`. A `400` or `404` can come back with an empty body.
