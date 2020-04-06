export const overallWidth = 605
export const overallHeight = 500

export const bg = 'images/bg7.jpg'

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

export function diagramToFile (diagram, bgPosition) {
  const canvas = document.createElement('canvas')
  canvas.width = overallWidth
  canvas.height = overallHeight

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'white'
  ctx.rect(0, 0, overallWidth, overallHeight)
  ctx.fill()

  return loadBackground(bg)
    .then(drawOnLoad(ctx, bgPosition))
    .then(_ => loadDiagram(diagram.node()))
    .then(drawOnLoad(ctx, { x: 0, y: 0, w: overallWidth, h: overallHeight }))
    .then(_ => canvas)
}

export function addDownloadButton (name, canvas) {
  const a = document.createElement('a')
  a.innerText = 'download'
  a.href = canvas.toDataURL()
  a.download = `${name}.png`
  document.querySelector('.links').insertAdjacentText('beforeend', ' | ')
  document.querySelector('.links').insertAdjacentElement('beforeend', a)
}

export function addShareButton (canvas) {
  canvas.toBlob(function (f) {
    const imageFile = [ f ]
    if (navigator.canShare && navigator.canShare({ files: imageFile })) {
      const a = document.createElement('a')
      a.innerText = 'share'
      a.href = '#'
      a.onclick = navigator.share({
        files: imageFile,
        title: 'Coronazahlen - Jena',
        text: 'Aktuelle Coronazahlen aus Jena'
      })
      document.querySelector('.links').insertAdjacentText('beforeend', ' | ')
      document.querySelector('.links').insertAdjacentElement('beforeend', a)
    } else {
      window.alert(navigator.canShare);
      window.alert(navigator.canShare({ files: imageFile })
  })
}
