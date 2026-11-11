const assert = require('assert')
const model = require('../ProcessModel.js')

const sample = [
  '42 bash 99.0',
  '43 <tracker> 100.0',
  '44 idle 98.9',
  'bad line'
].join('\n')

const processes = model.parseProcesses(sample, 99)
assert.deepStrictEqual(processes.map(p => [p.pid, p.name, p.cpu]), [
  [42, 'bash', 99],
  [43, '&lt;tracker&gt;', 100]
])

let cache = {}
assert.strictEqual(model.shouldNotify(cache, '42:bash', 1000, 300000), true)
cache = model.recordAndPrune(cache, '42:bash', 1000, 300000)
assert.strictEqual(model.shouldNotify(cache, '42:bash', 2000, 300000), false)
assert.strictEqual(model.shouldNotify(cache, '42:bash', 301000, 300000), true)

cache = model.recordAndPrune(cache, '43:other', 301000, 300000)
assert.deepStrictEqual(cache, { '43:other': 301000 })
cache = model.recordAndPrune(cache, '43:other', 601001, 300000)
assert.deepStrictEqual(cache, { '43:other': 601001 })

console.log('high-cpu notification model tests: ok')
