// DON'T CHANGE THIS CONTENT

// eslint-disable-next-line no-undef
copy(
  // eslint-disable-next-line no-undef
  Array.from($$('.lake-table tr:not(.first-child)')).reduce((prev, $dom) => {
    if ($dom.querySelectorAll('td del').length > 0) {
      return prev
    }
    if ($dom.querySelector('td:nth-child(1)').textContent.trim() === '描述') {
      return prev
    }
    try {
      const themeToken = $dom.querySelector('td:nth-child(2)').textContent
      const darkLessToken = $dom.querySelector('td:nth-child(3) p').textContent
      let lightLessToken = darkLessToken
      if ($dom.querySelector('td:nth-child(4) p')) {
        lightLessToken = $dom.querySelector('td:nth-child(4) p').textContent
      }
      prev[themeToken] = [darkLessToken, lightLessToken]
    } catch (err) {
      console.log($dom)
      console.log(err)
    }
    return prev
  }, {})
)
