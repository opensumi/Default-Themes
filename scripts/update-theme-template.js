const path = require('path')
const fs = require('fs')
const yuqueTokenMap = require('./yuque-map')

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
      if (darkColor && darkColor.trim() !== '-') {
        darkThemeDesc[token] = darkColor
      }
      if (lightColor && lightColor.trim() !== '-') {
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
  ret.forEach(({ uid, themeDesc }) => {
    updateFile(uid, themeDesc)
  })
}

boot()
