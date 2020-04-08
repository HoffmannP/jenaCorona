/* globals d3 */

import * as shared from './shared.js'
import * as lib from './lib.js'
import de_DE from './local.de_DE.js'

export const margin = {
  left: 43,
  top: 18,
  right: 47,
  bottom: 112
}
export const width = shared.overallWidth - margin.left - margin.right
export const height = shared.overallHeight - margin.top - margin.bottom

const innerMargin = 15
const squareWidth = 5

const styles = [
  { color: '#ff420e', dot: 'rect' },
  { color: '#004586', dot: 'diamond' },
  { color: '#000000', dot: 'triangle' },
  { color: '#24a121', dot: 'dot' }
]

function cleanData (row) {
  return {
    date: 1000 * row.zeit,
    erkrankte: +row.erkrankte,
    genesene: +row.genesene,
    tote: +row.tote
  }
}

const formatPercent = x => `${Math.round(100 * x)} %`

d3.timeFormatDefaultLocale(de_DE)
const toDate = u => d3.timeFormat('%a, %e. %b')(new Date(u))

const url = 'offiziell.csv'
const svg = d3.create('svg')

d3.csv(url, cleanData).then(data => {
  data = data.slice(1)
  let prev
  data = data.map(d => {
    const now = d.erkrankte // - d.tote - d.genesene
    const v = { ...d, veränderung: now / prev - 1 }
    prev = now
    return v
  })

  svg
    .attr('width', shared.overallWidth)
    .attr('height', shared.overallHeight)
    .attr('viewBox', [-margin.left, -margin.top, shared.overallWidth, shared.overallHeight])
    .attr('xmlns', 'http://www.w3.org/2000/svg')

  const dates = data.map(d => d.date)
  const x = d3.scaleLinear().domain([d3.min(dates), d3.max(dates)]).range([innerMargin, width - innerMargin])
  const y1 = d3.scaleLinear().domain([0, 200]).range([height, 0])
  const y2 = d3.scaleLinear().domain([-0.3, 0.7]).range([height, 0])

  const datasets = [
    { name: 'erkrankte', axis: y1 },
    { name: 'veränderung', axis: y2 },
    { name: 'tote', axis: y1 },
    { name: 'genesene', axis: y1 }
  ]

  const xAxis = g => g
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .tickFormat(d => toDate(d))
      .tickValues(data.map(d => d.date)))
    .call(g => g.selectAll('.domain, .tick line')
      .attr('stroke', '#bbb'))
    .call(g => g.selectAll('.tick text')
      .attr('text-anchor', 'end')
      .attr('transform', 'rotate(-60) translate(-13, -8)'))

  const y1Axis = g => g
    .attr('transform', `translate(0,0)`)
    .call(d3.axisLeft(y1))
    .call(g => g.selectAll('.domain')
      .attr('stroke', '#bbb'))
    .call(g => g.selectAll('.tick line')
      .attr('x2', width)
      .attr('stroke', '#bbb'))
    .call(g => g.select('.tick:last-of-type text').clone()
      .attr('x', 3)
      .attr('text-anchor', 'start')
      .attr('font-weight', 'bold')
      .text(data.erkrankte))

  const y2Axis = g => g
    .attr('transform', `translate(${width},0)`)
    .attr('fill', 'grey')
    .call(d3.axisRight(y2)
      .tickFormat(formatPercent)
      .tickValues([-0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]))
    .call(g => g
      .selectAll('.tick text')
      .attr('color', (d, i) => d < 0 ? '#C00000' : 'default'))
    .call(g => g.selectAll('.domain, .tick line')
      .attr('stroke', '#bbb'))
    .call(g => g.select('.tick:last-of-type text').clone()
      .attr('x', 3)
      .attr('text-anchor', 'end')
      .attr('font-weight', 'bold')
      .text(data.veränderung))

  svg.append('g').call(xAxis)
  svg.append('g').call(y1Axis)
  svg.append('g').call(y2Axis)

  svg.append('g')
    .attr('class', 'lines')
    .selectAll('lines')
    .data(datasets).enter()
    .append('g')
    .each((d, i, g) => {
      const dotNode = d3.select(g[i])
      lib.lineWithDot(dotNode, data, x, squareWidth, d, styles[i])
    })

  const firstUpper = text => `${text[0].toLocaleUpperCase()}${text.substring(1)}`

  svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(0, ${shared.overallHeight - 30})`)
    .selectAll('g')
    .data(datasets).enter()
    .append('g')
    .attr('transform', (d, i) => `translate(${[0, 1, 2.2, 3][i] * width / 4}, 0)`)
    .call(g => g
      .append('text')
      .text(d => `${firstUpper(d.name)} (${(d.name === 'veränderung'
        ? formatPercent
        : x => x
      )(data[data.length - 1][d.name])})`)
      .attr('x', 4 * squareWidth)
      .attr('font-family', 'sans-serif'))
    .call(g => g
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', (d, i) => styles[i].color)
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', `M0,-4l${3 * squareWidth},0`))
    .each((d, i, g) => {
      const dotNode = d3.select(g[i]).selectAll('dots.example').data([{ date: 1.5 * squareWidth, y: -4 }])
      lib.dotfunc[styles[i].dot](dotNode, x => x, squareWidth, 'y', styles[i].color, y => y)
    })

  svg.selectAll('text')
    .attr('font-size', 13)

  svg.append('text')
    .text('Coronafälle Jena')
    .attr('font-family', 'sans-serif')
    .attr('dominant-baseline', 'middle')
    .attr('text-anchor', 'middle')
    .attr('font-size', '18')
    .attr('x', width / 2)
    .attr('y', margin.top)

  svg.append('text')
    .text('mit Steigungsrate')
    .attr('font-family', 'sans-serif')
    .attr('dominant-baseline', 'middle')
    .attr('text-anchor', 'middle')
    .attr('font-size', '15')
    .attr('x', width / 2)
    .attr('y', margin.top + height / 10)

  shared.disclaimer(d3, svg, new Date(data[data.length - 1].date))
    .attr('x', width / 2)
    .attr('y', -9)

  document.body.appendChild(svg.node())
  svg.node().style.backgroundImage = `url(${shared.bg})`
  if ((document.documentElement.clientWidth < shared.overallWidth) ||
      (document.documentElement.clientHeight < shared.overallWidth)) {
    const factor = Math.min(
      document.documentElement.clientWidth / shared.overallWidth,
      document.documentElement.clientHeight / shared.overallHeight
    )
    svg.attr('width', factor * shared.overallWidth)
    svg.attr('height', factor * shared.overallHeight)
    svg.node().style.backgroundPosition = `${factor * margin.left}px ${factor * margin.top}px`
    svg.node().style.backgroundSize = `${factor * width}px ${factor * height}px`
  } else {
    svg.node().style.backgroundPosition = `${margin.left}px ${margin.top}px`
    svg.node().style.backgroundSize = `${width}px ${height}px`
  }

  /*
    const targetImg = document.createElement('img')
    document.body.appendChild(targetImg)
    .then(dataUrl => (targetImg.src = canvas.toDataUrl()))
  */

  shared.diagramToFile(svg, { x: margin.left, y: margin.top, w: width, h: height })
    .then(canvas => {
      shared.addDownloadButton('Jena', canvas)
      shared.addShareButton('Jena', canvas)
    })
})
