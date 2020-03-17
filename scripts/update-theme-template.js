const path = require('path')
const fs = require('fs')

const ora = require('ora')

const yuqueTokenMap = require('../token-map')

function updateFile(uid, themeDesc) {
  const targetFile = path.resolve(
    __dirname,
    `../templates/${uid}/defaults.json`
  )
  fs.writeFileSync(targetFile, JSON.stringify(themeDesc, null, 2))
}

function getThemeDesc() {
  const darkThemeDesc = {}
  const lightThemeDesc = {}

  Object.keys(yuqueTokenMap)
    .sort()
    .forEach(token => {
      const [darkColor, lightColor] = yuqueTokenMap[token]
      if (darkColor && darkColor !== '-') {
        darkThemeDesc[token] = darkColor
      }
      if (lightColor && lightColor !== '-') {
        lightThemeDesc[token] = lightColor
      }
    })

  return [
    {
      uid: 'light',
      themeDesc: lightThemeDesc
    },
    {
      uid: 'dark',
      themeDesc: darkThemeDesc
    }
  ]
}

function boot() {
  const ret = getThemeDesc()
  const spinner = ora('Updating theme template content').start()
  ret.forEach(({ uid, themeDesc }) => {
    updateFile(uid, themeDesc)
  })

  spinner.succeed('Finished updating theme template content')
}

boot()
