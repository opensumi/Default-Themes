const path = require('path')
const fs = require('fs')
const { promisify } = require('util')

const username = require('git-user-name')
const got = require('got')
const cheerio = require('cheerio')
const isGitClean = require('is-git-clean')

const { jsonPretty } = require('./utils')
const docs = require('./docs')

const fsWriteFile = promisify(fs.writeFile)

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
    const promises = docSlugs.map(slug => this.fetchBodyHtml(slug))
    await Promise.all(promises)

    const clean = await isGitClean(TARGET_DIR, { files: [`!${revisionText}`] })
    if (!clean) {
      await fsWriteFile(
        path.resolve(TARGET_DIR, revisionText),
        `Updated by ${username()} at ${new Date().toString()}`,
        {}
      )
    } else {
      console.log('No changes')
    }
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
    $('.lake-table tbody tr').each((index, element) => {
      // 跳过 th 表头
      if (index === 0) {
        return
      }

      const $$ = $(element)
      const $tdChild = $$.children('td')
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
      const firstTd = $tdChild.first().html()
      if (firstTd.includes('del') || firstTd.includes('line-through')) {
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

    return result
  }
}

new CrawlProcess().start()
