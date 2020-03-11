const fs = require('fs')

const lessToJs = require('less-vars-to-js')
const Color = require('color')

const hexTransparencyMap = require('./hex-transparency-map')

function convertDashToKebab(str) {
  // convert dash to kebab to make lodash.template works
  return str.replace(/-/g, '_')
}

function getPaletteDesc(palettePath) {
  const paletteLess = fs.readFileSync(palettePath, 'utf8')
  const platte = lessToJs(paletteLess, {
    resolveVariables: true,
    stripPrefix: true
  })
  // 将所有的 key 转化成 kebab
  return Object.keys(platte).reduce((prev, key) => {
    prev[convertDashToKebab(key)] = platte[key]
    return prev
  }, {})
}

function jsonPretty(obj) {
  return JSON.stringify(obj, null, 2)
}

function jsonStrPretty(jsonStr) {
  return jsonPretty(JSON.parse(jsonStr))
}

function opacity(hex, transparency = 100) {
  const color = Color(hex)
  return color.hex() + hexTransparencyMap[transparency]
}

module.exports = {
  convertDashToKebab,
  getPaletteDesc,
  jsonStrPretty,
  jsonPretty,
  opacity
}
