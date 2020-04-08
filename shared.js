export const overallWidth = 605
export const overallHeight = 500

export const bg = 'images/bg8.jpg'

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
    .then(() => loadDiagram(diagram.node()))
    .then(drawOnLoad(ctx, { x: 0, y: 0, w: overallWidth, h: overallHeight }))
    .then(() => canvas)
}

export function addDownloadButton (name, canvas) {
  const a = document.createElement('a')
  a.innerText = 'download'
  a.href = canvas.toDataURL()
  a.download = `${name}.png`
  document.querySelector('.links').insertAdjacentText('beforeend', ' | ')
  document.querySelector('.links').insertAdjacentElement('beforeend', a)
}

export function share (file) {
  return clickEvent => {
    if (navigator.canShare && navigator.canShare({ files: [ file ] })) {
      navigator.share({
        url: 'https://hoffis-eck.de/jenaCorona',
        title: 'Coronazahlen - Jena',
        text: 'Aktuelle Coronazahlen aus Jena',
        files: [ file ]
      })
        .then(result => console.log('Success', result))
        .catch(error => console.log('Error', error))
    } else {
      console.log('Not available')
    }
  }
}

export function addShareButton (name, canvas) {
  canvas.toBlob(function (blob) {
    const imageFile = new window.File([blob], `${name}.png`, { type: blob.type })
    if (navigator.canShare && navigator.canShare({ files: [ imageFile ] })) {
      const a = document.createElement('a')
      a.innerText = 'share'
      a.href = '#'
      a.addEventListener('click', share(imageFile))
      document.querySelector('.links').insertAdjacentText('beforeend', ' | ')
      document.querySelector('.links').insertAdjacentElement('beforeend', a)
    }
  })
}

export function disclaimer (d3, svg, date) {
  return svg.append('text')
    .text(`🄯2019 hoffis-eck.de/jenaCorona, letzte Aktualisierung: ${d3.timeFormat('%a, %e. %b %H:%M')(date)}`)
    .style('fill', '#bbb')
    .style('font-family', 'sans-serif')
    .style('dominant-baseline', 'middle')
    .style('text-anchor', 'middle')
    .style('font-size', '10')
}