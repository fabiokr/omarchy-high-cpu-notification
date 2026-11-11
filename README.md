# High CPU Notification for Omarchy

[![Omarchy Shell Plugin](https://img.shields.io/badge/Omarchy-Shell%20Plugin-c6aa75?style=flat-square)](https://omarchy.org/)
[![Validate](https://img.shields.io/github/actions/workflow/status/fabiokr/omarchy-high-cpu-notification/validate.yml?branch=main&style=flat-square&label=validate)](https://github.com/fabiokr/omarchy-high-cpu-notification/actions/workflows/validate.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-6aa6b2?style=flat-square)](LICENSE)

A lightweight Omarchy shell service that watches running processes and sends a
desktop notification when a process reaches 99% CPU usage.

The service polls once per second and keeps a persistent per-process cache, so
a process does not repeatedly notify while it remains busy. After five minutes,
the cache entry expires and that process may notify again.

## Highlights

- Monitors process CPU usage every second
- Notifies at `99%` CPU or higher
- Uses the notification text `Process x has a high cpu usage`
- Suppresses repeated notifications for five minutes per process
- Persists the notification cache across shell reloads
- Prunes expired cache entries automatically
- Uses argv-based process execution instead of shell interpolation
- Sanitizes process names before passing them to the notification sink
- Runs as a headless Omarchy `service` plugin with no bar widget

## Install

The plugin requires Omarchy shell plugin support.

```sh
omarchy plugin add https://github.com/fabiokr/omarchy-high-cpu-notification.git --enable
```

The shell normally discovers and enables the service immediately. If it does
not start after installation, restart the shell once:

```sh
omarchy restart shell
```

## Behavior

For every one-second sample, the service runs:

```sh
ps -eo pid=,comm=,pcpu= --sort=-pcpu
```

Only processes at or above `99%` CPU are considered. The cache key combines the
process PID and name. A notification is sent only when that key has no recent
notification, or when its previous notification is at least five minutes old.

The cache is stored by Omarchy's `PersistentProperties`, so shell reloads do
not reset the cooldown state. Expired entries are removed during each sample.

## Configure

The current thresholds and intervals are intentionally fixed:

| Setting | Value |
| --- | ---: |
| Poll interval | 1 second |
| CPU threshold | 99% |
| Notification cooldown | 5 minutes |

## Development

Validate the plugin and run the model tests from a checkout:

```sh
omarchy plugin validate .
node tests/ProcessModel.test.js
```

The tests cover threshold selection, process-name sanitization, notification
suppression, cooldown expiry, and cache cleanup.

Changes inside an installed plugin directory normally hot-reload. Restart the
shell if a QML component remains cached:

```sh
omarchy restart shell
```

## Files

| File | Purpose |
| --- | --- |
| `manifest.json` | Omarchy plugin metadata and service entry point |
| `Service.qml` | One-second process monitor and notification service |
| `ProcessModel.js` | Parsing, sanitization, and cooldown logic |
| `tests/ProcessModel.test.js` | Unit tests for the model logic |

## Privacy and dependencies

All monitoring stays on-device. The plugin does not use the network, collect
credentials, or send telemetry. It relies on `ps`, which is available in a
standard Omarchy installation, and Omarchy's notification command.

## License

[MIT](LICENSE) © 2026 Fabio Kreusch.
