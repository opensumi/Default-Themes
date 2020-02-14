const fs = require('fs')
const path = require('path')
const lessToJs = require('less-vars-to-js')
const Color = require('color')

const hexTransparencyMap = require('./hex-transparency-map')

function convertDashToKebab(str) {
  // convert dash to kebab
  return str.replace(/-/g, '_')
}

function getPaletteDesc(theme = 'dark') {
  const targetThemeLessPath = path.resolve(
    __dirname,
    `../palette/${theme}.less`
  )
  const paletteLess = fs.readFileSync(targetThemeLessPath, 'utf8')
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

function jsonPretty(jsonStr) {
  return JSON.stringify(JSON.parse(jsonStr), null, 2)
}

function opacity(hex, transparency = 100) {
  const color = Color(hex)
  return color.hex() + hexTransparencyMap[transparency]
}

module.exports = {
  convertDashToKebab,
  getPaletteDesc,
  jsonPretty,
  opacity
}
