function safeProcessName(value) {
  var name = String(value || "").trim()
  if (!name) return "unknown"
  // Notification text is rendered by a shared sink; keep markup-shaped names inert.
  return name.replace(/[&<>\"']/g, function(ch) {
    return {"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"}[ch]
  }).slice(0, 128)
}

function parseProcesses(text, threshold) {
  var rows = String(text || "").split(/\r?\n/)
  var result = []
  for (var i = 0; i < rows.length; i++) {
    var line = rows[i].trim()
    if (!line) continue
    var match = line.match(/^(\d+)\s+(\S+)\s+([0-9]+(?:\.[0-9]+)?)$/)
    if (!match) continue
    var cpu = Number(match[3])
    if (!Number.isFinite(cpu) || cpu < threshold) continue
    result.push({ pid: Number(match[1]), name: safeProcessName(match[2]), cpu: cpu })
  }
  return result
}

function shouldNotify(cache, key, nowMs, cooldownMs) {
  if (!cache || !Object.prototype.hasOwnProperty.call(cache, key)) return true
  var last = Number(cache[key])
  return !Number.isFinite(last) || nowMs - last >= cooldownMs
}

function recordAndPrune(cache, key, nowMs, cooldownMs) {
  var next = {}
  var cutoff = nowMs - cooldownMs
  Object.keys(cache || {}).forEach(function(existingKey) {
    var timestamp = Number(cache[existingKey])
    if (Number.isFinite(timestamp) && timestamp > cutoff) next[existingKey] = timestamp
  })
  next[key] = nowMs
  return next
}

if (typeof module !== "undefined") {
  module.exports = { safeProcessName, parseProcesses, shouldNotify, recordAndPrune }
}
