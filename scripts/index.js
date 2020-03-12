const fs = require('fs')
const path = require('path')
const _ = require('lodash')

const json5 = require('json5')
const stripJsonComments = require('strip-json-comments')
const Hbs = require('handlebars')
const isColor = require('is-color')
const Color = require('color')
const ora = require('ora')

const pkg = require('../package.json')

const {
  convertDashToKebab,
  getPaletteDesc,
  jsonStrPretty,
  opacity
} = require('./utils')

Hbs.registerHelper('opacity', opacity)

const regexp = /(\w+)\((.+(,.+)?)\)/

class JsonProcess {
  async start(uid, plattePath, category) {
    const spinner = ora('Updating theme json files').start()
    try {
      const colorDesc = this.readTemplateJson(uid)
      const objDesc = this.evaluate(uid, colorDesc)
      const text = this.compile(objDesc, plattePath)
      this.writeJsonFile(text, category)
      spinner.succeed('Finished updating theme json files')
    } catch (err) {
      spinner.fail('Failed')
      console.log(err)
    }
  }

  writeJsonFile(text, category) {
    fs.writeFileSync(
      path.resolve(__dirname, `../themes/${category}/defaults.json`),
      jsonStrPretty(text),
      {
        encoding: 'utf8'
      }
    )
  }

  compile(desc, plattePath) {
    const templateFn = Hbs.compile(JSON.stringify(desc))
    const platte = getPaletteDesc(plattePath)
    const text = templateFn(platte)
    return text
  }

  evaluate(uid, colorDesc) {
    const result = {
      $schema: 'vscode://schemas/color-theme',
      name: `${_.upperFirst(uid)} Default Colors`,
      colors: {}
    }
    Object.entries(colorDesc).forEach(([key, val]) => {
      const value = val.trim()
      // 跳过色值, 只处理 token
      if (isColor(value)) {
        return Color(value).hex()
      }

      if (regexp.test(value)) {
        const [, funcStr, argsStr] = regexp.exec(value)
        const func = funcStr.trim()
        const args = argsStr
          .trim()
          .split(',')
          .map(n => (n ? n.trim() : ''))
          .filter(n => n)
        switch (func) {
          case 'opacity':
            result.colors[key] = this.handleOpacity(args)
        }
      } else {
        result.colors[key] = `{{ ${convertDashToKebab(value)} }}`
      }
    })
    return result
  }

  readTemplateJson(uid) {
    const templateJson = fs.readFileSync(
      path.resolve(__dirname, `../templates/${uid}/defaults.json`),
      {
        encoding: 'utf8'
      }
    )
    const content = stripJsonComments(templateJson)
    const obj = json5.parse(content)
    return obj
  }

  handleOpacity(args) {
    return `{{ opacity ${convertDashToKebab(args[0])} ${Number(args[1])} }}`
  }
}

pkg.ideThemeConfig.forEach(themeConfig => {
  const { id, palette, category } = themeConfig
  const plattePath = path.join(process.cwd(), palette)
  // 移除 ide- 前缀作为 uid
  const uid = id.replace(/^ide-/, '')
  const jsonProcess = new JsonProcess()
  jsonProcess.start(uid, plattePath, category)
})
