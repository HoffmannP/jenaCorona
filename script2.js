import diagram, { overallHeight, overallWidth, bg } from './diagram2.js'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
canvas.width = overallWidth
canvas.height = overallHeight

new Promise(function (resolve) {
  const bgImg = document.createElement('img')
  bgImg.addEventListener('load', resolve)
  bgImg.src = bg
}).then(function (e) {
  ctx.fillStyle = 'white'
  ctx.rect(0, 0, overallWidth, overallHeight)
  ctx.fill()
  ctx.drawImage(e.target, 33, 52, 515, 371)

  new Promise(function (resolve) {
    const tempImg = document.createElement('img')
    tempImg.addEventListener('load', resolve)
    tempImg.src = 'data:image/svg+xml,' + encodeURIComponent(diagram.outerHTML)
  }).then(function (e) {
    ctx.drawImage(e.target, 0, 0)
    document.querySelector('a[download]').href = canvas.toDataURL()
  })
})
