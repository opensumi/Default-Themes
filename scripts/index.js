const fs = require('fs')
const path = require('path')

const json5 = require('json5')
const stripJsonComments = require('strip-json-comments')
const Hbs = require('handlebars')
const isColor = require('is-color')
const Color = require('color')

const pkg = require('../package.json')

const {
  convertDashToKebab,
  getPaletteDesc,
  jsonPretty,
  opacity
} = require('./utils')

Hbs.registerHelper('opacity', opacity)

async function bootstrap(uid, plattePath, category) {
  try {
    const templateJson = fs.readFileSync(
      path.resolve(__dirname, `../templates/${uid}/defaults.json`),
      {
        encoding: 'utf8'
      }
    )

    const content = stripJsonComments(templateJson)
    const obj = json5.parse(content)
    obj.name = `Dark Default Colors`
    Object.entries(obj.colors).forEach(([key, val]) => {
      const value = val.trim()
      // 跳过色值, 只处理 token
      if (isColor(value)) {
        return Color(value).hex()
      }

      if (value.includes(',')) {
        const [tokenStr, opacity] = value.split(',')
        const token = convertDashToKebab(tokenStr.trim())
        obj.colors[key] = `{{ opacity ${token} ${Number(opacity)} }}`
      } else {
        obj.colors[key] = `{{ ${convertDashToKebab(value)} }}`
      }
    })

    const templateFn = Hbs.compile(JSON.stringify(obj))
    const platte = getPaletteDesc(plattePath)
    const text = templateFn(platte)

    fs.writeFileSync(
      path.resolve(__dirname, `../themes/${category}/defaults.json`),
      jsonPretty(text),
      {
        encoding: 'utf8'
      }
    )
  } catch (err) {
    console.log(err)
  }
}

pkg.ideThemeConfig.forEach(themeConfig => {
  const { id, palette, category } = themeConfig
  if (id === 'ide-light') {
    const plattePath = path.join(process.cwd(), palette)
    // 移除 ide- 前缀作为 uid
    const uid = id.replace(/^ide-/, '')
    bootstrap(uid, plattePath, category)
  }
})
