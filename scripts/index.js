const fs = require('fs')
const path = require('path')

const json5 = require('json5')
const stripJsonComments = require('strip-json-comments')
const Hbs = require('handlebars')
const isColor = require('is-color')
const Color = require('color')

const {
  convertDashToKebab,
  getPaletteDesc,
  jsonPretty,
  opacity
} = require('./utils')

const templateJson = fs.readFileSync(
  path.resolve(__dirname, '../templates/dark/defaults.json'),
  {
    encoding: 'utf8'
  }
)

Hbs.registerHelper('opacity', opacity)

async function bootstrap() {
  try {
    const content = stripJsonComments(templateJson)
    const obj = json5.parse(content)
    obj.name = 'plaplapla'
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
    const platte = getPaletteDesc('dark')
    const text = templateFn(platte)

    fs.writeFileSync(
      path.resolve(__dirname, '../themes/dark/defaults.json'),
      jsonPretty(text),
      {
        encoding: 'utf8'
      }
    )
  } catch (err) {
    console.log(err)
  }
}

bootstrap()
