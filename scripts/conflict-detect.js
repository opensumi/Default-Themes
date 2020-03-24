const chalk = require('chalk')
const _ = require('lodash')

const docs = require('./docs')

class ConflictDetect {
  start() {
    const result = {
      warning: [],
      error: []
    }

    docs
      .map(docSlug => ({
        slug: docSlug,
        data: require(`../token-map/${docSlug}.json`)
      }))
      .reduce((prev, cur) => {
        const { data, slug } = cur
        Object.keys(data).forEach(key => {
          const existedValue = prev[key]
          // console.log(key, existedValue)
          if (existedValue) {
            const themeValue = data[key]
            if (_.isEqual(existedValue, themeValue)) {
              result.warning.push(
                chalk.yellow(
                  `${key} is duplicated in https://lark.alipay.com/ide-framework/ide-token/${slug}`
                )
              )
            } else {
              result.error.push(
                chalk.red(
                  `${key}: ${themeValue} is conflicted with existed value ${existedValue} in https://lark.alipay.com/ide-framework/ide-token/${slug}`
                )
              )
            }
          }
        })
        prev = { ...prev, ...cur.data }
        return prev
      }, {})

    if (result.warning.length || result.error.length) {
      console.log('----- Conflict detection results: -----')
      if (result.warning.length) {
        console.log(chalk.bgYellowBright('Warnings:'))
        result.warning.forEach(msg => {
          console.log(msg)
        })
      }

      if (result.error.length) {
        console.log(chalk.bgRedBright('Errors:'))
        result.error.forEach(msg => {
          console.log(msg)
        })
      }

      console.log('----- Conflict detection end -----')
    }
  }
}

// conflict detect
new ConflictDetect().start()
