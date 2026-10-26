---
title: Polling Settings
description: Interval, time, and cron schedule configuration
---

# Polling Settings

Source connectors that poll for data (Database Reader, File Reader, JavaScript Reader) support configurable polling schedules.

## Polling schedule types

### Interval

Polls at a fixed interval. The schedule is built when the source connector starts, and poll times are aligned to the start of the day's Active Time range, or to midnight when Active Time is All Day or the range crosses midnight. The first poll runs at the next multiple of the interval measured from that point, not one interval after the connector starts. A 6-hour interval polls at 00:00, 06:00, 12:00, and 18:00 no matter when the channel came up.

| Setting | Description |
|---|---|
| **Interval** | Time between polls. Enter a number and select the unit: milliseconds, seconds, minutes, or hours. The value must be greater than zero and less than 24 hours. It is stored in the channel as `pollingFrequency`, in milliseconds. |

Example: Poll every 5 seconds.

The schedule exists only while the source connector is running. Deploying a channel starts the connector unless the channel's initial state is Stopped or Paused, and a channel deployed in either of those states does not poll until it is started. Enable Poll Once on Start to get a poll the moment the connector starts, ahead of the aligned schedule.

### Time

Polls once per day at a specific time.

| Setting | Description |
|---|---|
| **Time** | The time of day to poll (hour and minute) |

Example: Poll once daily at 6:00 AM.

### Cron

Polls according to one or more cron expressions.

| Setting | Description |
|---|---|
| **Cron Jobs** | A table of cron expressions, each with an optional description |

#### Cron expression format

The engine hands each expression to Quartz, which needs six fields plus an optional seventh field for the year:

```text
second minute hour day-of-month month day-of-week [year]
```

Quartz cannot combine a day-of-month value with a day-of-week value, so one of the two fields must be `?`. An expression that sets both is rejected as invalid.

| Field | Values | Special Characters |
|---|---|---|
| Second | 0-59 | `, - * /` |
| Minute | 0-59 | `, - * /` |
| Hour | 0-23 | `, - * /` |
| Day of Month | 1-31 | `, - * ? / L W` |
| Month | 1-12 or JAN-DEC | `, - * /` |
| Day of Week | 1-7 or SUN-SAT | `, - * ? / L #` |
| Year (optional) | Up to 100 years after the current year. A schedule that can never fire, such as a later or a past year, stops the channel from starting | `, - * /` |

#### Examples

| Expression | Schedule |
|---|---|
| `0 0/5 * * * ?` | Every 5 minutes |
| `0 0 8 * * ?` | Daily at 8:00 AM |
| `0 0 8,17 * * ?` | Daily at 8:00 AM and 5:00 PM |
| `0 0 */2 * * ?` | Every 2 hours |
| `0 0 9-17 ? * MON-FRI` | Hourly from 9 AM to 5 PM, weekdays only |
| `0 30 6 ? * MON` | Every Monday at 6:30 AM |
| `0 0 0 1 * ?` | First day of every month at midnight |

## Common settings

These settings are available regardless of which schedule type is selected:

| Setting | Description |
|---|---|
| **Schedule Type** | Interval, Time, or Cron |
| **Poll Once on Start** | Poll once as soon as the source connector starts, before the scheduled poll |

### Poll Once on Start
When enabled, the connector polls once as soon as the source connector starts, without waiting for the first scheduled poll time. The source connector starts when the channel starts, when a paused channel resumes, and when a deploy leaves the channel started.

## Advanced polling settings

The Advanced Settings dialog (wrench icon) is available for Interval and Time schedule types, but not for Cron.

### Active Days

Sets the days polling runs on.

| Mode | Description |
|---|---|
| **Weekly** | Select specific days of the week (Sunday through Saturday) when polling is active. At least one day must be selected. |
| **Monthly** | Select a specific day of the month (1-31) when polling is active. |

### Active Time (Interval only)

Controls the time window during which interval-based polling is active. This setting is not available for Time schedule type (since Time already specifies a single poll time).

| Mode | Description |
|---|---|
| **All Day** | Polling may occur at any time during the day (default). |
| **Range** | Polling only occurs during the specified time range (e.g., 8:00 AM to 5:00 PM). |

## Polling vs. listener connectors

| Behavior | Polling (Reader) | Listener |
|---|---|---|
| **Initiation** | OIE pulls data on a schedule | The sender pushes data |
| **Connectors** | Database Reader, File Reader, JavaScript Reader | TCP Listener, HTTP Listener, Channel Reader, JMS Listener, Web Service Listener, DICOM Listener |
| **Schedule** | Interval, time, or cron | N/A (always listening) |
| **Latency** | Depends on the schedule | Processed as it arrives |

