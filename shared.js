export const overallWidth = 605
export const overallHeight = 500

export const bg = 'images/bg6.jpg'

function loadBackground (backgroundImageUrl) {
  return new Promise(function (resolve) {
    const bgImg = document.createElement('img')
    bgImg.addEventListener('load', resolve)
    bgImg.src = backgroundImageUrl
  })
}

function loadDiagram (dg) {
  return new Promise(function (resolve) {
    const tempImg = document.createElement('img')
    tempImg.addEventListener('load', resolve)
    tempImg.src = 'data:image/svg+xml,' + encodeURIComponent(dg.outerHTML)
  })
}

function drawOnLoad (ctx, size) {
  return loadEvent => ctx.drawImage(loadEvent.target, size.x, size.y, size.w, size.h)
}

export function toDataURL (diagram, bgPosition) {
  const canvas = document.createElement('canvas')
  canvas.width = overallWidth
  canvas.height = overallHeight

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'white'
  ctx.rect(0, 0, overallWidth, overallHeight)
  ctx.fill()

  return loadBackground(bg)
    .then(drawOnLoad(ctx, bgPosition))
    .then(_ => loadDiagram(diagram))
    .then(drawOnLoad(ctx, { x: 0, y: 0 , w: overallWidth, h: overallHeight}))
    .then(_ => canvas.toDataURL())
}
