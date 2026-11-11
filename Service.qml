import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import "ProcessModel.js" as ProcessModel

Item {
  id: root

  property var shell: null
  readonly property int thresholdPercent: 99
  readonly property int cooldownMs: 5 * 60 * 1000
  property bool samplePending: false

  PersistentProperties {
    id: persisted
    reloadableId: "fabio-high-cpu-notification"
    property string notificationCacheJson: "{}"
  }

  function cache() {
    try {
      var value = JSON.parse(persisted.notificationCacheJson || "{}")
      return value && typeof value === "object" && !Array.isArray(value) ? value : {}
    } catch (e) {
      return {}
    }
  }

  function checkProcesses(output) {
    var now = Date.now()
    var currentCache = cache()
    var processes = ProcessModel.parseProcesses(output, root.thresholdPercent)

    // Prune expired entries even when no process is currently above the threshold.
    var pruned = {}
    Object.keys(currentCache).forEach(function(key) {
      var timestamp = Number(currentCache[key])
      if (Number.isFinite(timestamp) && now - timestamp < root.cooldownMs) pruned[key] = timestamp
    })

    processes.forEach(function(process) {
      var key = String(process.pid) + ":" + process.name
      if (!ProcessModel.shouldNotify(pruned, key, now, root.cooldownMs)) return
      Util.execArgv([
        "omarchy-notification-send",
        "Process " + process.name + " has a high cpu usage"
      ])
      pruned = ProcessModel.recordAndPrune(pruned, key, now, root.cooldownMs)
    })

    persisted.notificationCacheJson = JSON.stringify(pruned)
  }

  function poll() {
    if (sampleProcess.running) {
      samplePending = true
      return
    }
    samplePending = false
    sampleProcess.running = true
  }

  Process {
    id: sampleProcess
    command: ["ps", "-eo", "pid=,comm=,pcpu=", "--sort=-pcpu"]
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: root.checkProcesses(text)
    }
    onExited: {
      if (root.samplePending) Qt.callLater(root.poll)
    }
  }

  Timer {
    interval: 1000
    repeat: true
    running: true
    triggeredOnStart: true
    onTriggered: root.poll()
  }
}
