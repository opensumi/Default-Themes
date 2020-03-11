const path = require('path')
const fs = require('fs')
const docs = require('./docs')

const tokenMapDir = path.resolve(__dirname, '../token-map')

function getYuqueTokenMap() {
  const result = {}
  for (const docSlug of docs) {
    const filename = docSlug + '.json'
    const docJsonPath = path.join(tokenMapDir, filename)
    if (fs.existsSync(docJsonPath)) {
      const jsonStr = fs.readFileSync(docJsonPath, { encoding: 'utf8' })
      try {
        const objDesc = JSON.parse(jsonStr)
        Object.assign(result, objDesc)
      } catch (err) {
        console.warn(filename + ' contains an invalid json string')
      }
    } else {
      console.warn(filename + ' not existed')
    }
  }
  return result
}

module.exports = getYuqueTokenMap
