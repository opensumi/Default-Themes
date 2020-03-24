const chalk = require('chalk')

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
          if (existedValue) {
            const themeValue = data[key]
            if (existedValue !== themeValue) {
              result.error.push(
                chalk.error(
                  `${key}: ${themeValue} is conflicted with existed value in https://lark.alipay.com/ide-framework/ide-token/${slug}`
                )
              )
            } else {
              result.warning.push(
                chalk.warning(
                  `${key} is duplicated in https://lark.alipay.com/ide-framework/ide-token/${slug}`
                )
              )
            }
          }
        })
        Object.assign(prev, cur)
        return prev
      }, {})

    if (result.warning.length || result.error.length) {
      console.log('----- Conflict detection results: -----')
      if (result.warning.length) {
        console.log(chalk.warning('Warnings:'))
        result.warning.forEach(msg => {
          console.log(msg)
        })
      }

      if (result.error.length) {
        console.log(chalk.warning('Errors:'))
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
