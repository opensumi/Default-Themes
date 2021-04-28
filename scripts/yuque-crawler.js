const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const bluebird = require('bluebird')

const ora = require('ora')
const chalk = require('chalk')
const username = require('git-user-name')
const got = require('got')
const cheerio = require('cheerio')
const cgf = require('changed-git-files')
const inquirer = require('inquirer')

const { jsonPretty } = require('./utils')
const docs = require('./docs')

const fsWriteFile = promisify(fs.writeFile)
const gitChangedFiles = promisify(cgf)

const API_HOST = 'https://yuque.antfin-inc.com/api/v2'

const TARGET_DIR = path.resolve(__dirname, '../token-map')

const client = got.extend({
  prefixUrl: API_HOST,
  responseType: 'json',
  headers: {
    'X-Auth-Token': process.env.YUQUE_TOKEN
  }
})

const repoSlug = 'ide-framework/ide-token'
const docSlugs = docs

const revisionText = '_revision.txt'

class CrawlProcess {
  // curl -H 'X-Auth-Token: ${token}' https://yuque.com/api/v2/repos/ide-framework/ide-token/docs/basic
  async start() {
    const spinner = ora('Crawling content from yuque').start()

    await bluebird.map(
      docSlugs,
      slug => {
        return this.fetchBodyHtml(slug).catch(err => {
          console.log('slug fetch with error:', err)
        })
      },
      { concurrency: 3 }
    )

    await this.generateTokenMapEntry()

    const files = await gitChangedFiles()
    if (
      files.length &&
      files.some(
        file =>
          file.filename.startsWith('token-map') &&
          !file.filename.endsWith(revisionText)
      )
    ) {
      await fsWriteFile(
        path.resolve(TARGET_DIR, revisionText),
        `Updated by ${username()} at ${new Date().toString()}`,
        {}
      )
      spinner.succeed('Finish crawling content from yuque')
    } else {
      spinner.succeed('No changes')

      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'There is no changes so far, will you continue to update',
          default: false
        }
      ])
      if (!answers.confirm) {
        console.log(chalk.green('Bye bye'))
        process.exit(0)
      }
    }
  }

  async generateTokenMapEntry() {
    // eslint-disable-next-line prettier/prettier
    const entryContent =
      `
// GENERATE BY ./scripts/yuque-crawler.js
// DON NOT EDIT IT MANUALLY
module.exports = Object.assign(
  {},
${docs.map(docSlug => `  require('./${docSlug}.json')`).join(',\n')}
)
    `.trim() + '\n'
    await fsWriteFile(path.resolve(TARGET_DIR, 'index.js'), entryContent, {
      encoding: 'utf8'
    })
  }

  async fetchBodyHtml(slug) {
    const res = await client(`repos/${repoSlug}/docs/${slug}`)
    const { body_html: html } = res.body.data
    const content = this.queryContent(html)
    await fsWriteFile(
      path.resolve(TARGET_DIR, slug + '.json'),
      jsonPretty(content),
      {}
    )
  }

  queryContent(html) {
    const $ = cheerio.load(html)
    const result = {}

    // 老的 lake table
    if ($('.lake-table')) {
      $('.lake-table tbody tr').each((index, element) => {
        // 跳过 th 表头
        if (index === 0) {
          return
        }

        const $element = $(element)
        const $tdChild = $element.children('td')
        // 跳过 描述 一栏
        if (
          $tdChild
            .first()
            .text()
            .trim() === '描述'
        ) {
          return
        }

        // 跳过 del 已删除
        // 坑：yuque 网页上渲染的是 <del> 标签
        // 但是接口拿回来的是 `<span style="text-decoration: line-through;"></span>`
        const twoTds = [$tdChild.first().html(), $tdChild.eq(1).html()]
        if (
          twoTds.some(
            html => html.includes('<del>') || html.includes('line-through')
          )
        ) {
          return
        }

        try {
          const themeToken = $tdChild
            .eq(1)
            .text()
            .trim()
          const darkLessVar = $tdChild
            .eq(2)
            .children('p')
            .first()
            .text()
            .trim()

          let lightLessVar = darkLessVar

          const $4thTd = $tdChild.eq(3)
          if ($4thTd) {
            const text = $4thTd
              .children('p')
              .first()
              .text()
              .trim()
            if (text) {
              lightLessVar = text
            }
          }

          result[themeToken] = [darkLessVar, lightLessVar]
        } catch (err) {
          console.warn('error with:', element)
          console.error(err)
        }
      })
    }

    // 新版本 yuque table
    // 目前跟上面老的代码处理是一致的
    if ($('.ne-table')) {
      $('.ne-table tbody tr').each((index, element) => {
        // 跳过 th 表头
        if (index === 0) {
          return
        }

        const $element = $(element)
        const $tdChild = $element.children('td')
        // 跳过 描述 一栏
        if (
          $tdChild
            .first()
            .text()
            .trim() === '描述'
        ) {
          return
        }

        // 跳过 del 已删除
        // 坑：yuque 网页上渲染的是 <del> 标签
        // 但是接口拿回来的是 `<span style="text-decoration: line-through;"></span>`
        const twoTds = [$tdChild.first().html(), $tdChild.eq(1).html()]
        if (
          twoTds.some(
            html => html.includes('<del>') || html.includes('line-through')
          )
        ) {
          return
        }

        try {
          const themeToken = $tdChild
            .eq(1)
            .text()
            .trim()
          const darkLessVar = $tdChild
            .eq(2)
            .children('p')
            .first()
            .text()
            .trim()

          let lightLessVar = darkLessVar

          const $4thTd = $tdChild.eq(3)
          if ($4thTd) {
            const text = $4thTd
              .children('p')
              .first()
              .text()
              .trim()
            if (text) {
              lightLessVar = text
            }
          }

          result[themeToken] = [darkLessVar, lightLessVar]
        } catch (err) {
          console.warn('error with:', element)
          console.error(err)
        }
      })
    }

    return result
  }
}

new CrawlProcess().start()
