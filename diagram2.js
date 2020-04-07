/* globals d3 */

import * as shared from './shared.js'

export const margin = {
  left: 33,
  top: 52,
  right: 57,
  bottom: 78
}
export const width = shared.overallWidth - margin.left - margin.right
export const height = shared.overallHeight - margin.top - margin.bottom

const alpha = 0.66

const categories = [
  { name: 'Genesen', key: 'genesene', color: `rgba(  0, 128,   0, ${alpha})` },
  { name: 'Tot', key: 'tote', color: `rgba(0,     0,   0, ${alpha})` },
  { name: 'Infiziert', key: 'infizierte', color: `rgba(  0,   0, 255, ${alpha})` },
  { name: 'Stationär', key: 'stationaer', color: `rgba(255, 165,   0, ${alpha})` },
  { name: 'Schwerer Verlauf', key: 'schwerer_verlauf', color: `rgba(255,   0,   0, ${alpha})` }
]

const toDate = u => d3.timeFormat('%e.%m.')(new Date(u))

const url = 'offiziell.csv'
const svg = d3.create('svg')
  .style('font-family', 'sans-serif')

svg.node()

d3.csv(url, row => ({
  date: 1000 * row.zeit,
  tote: -row.tote || -1e-9,
  schwerer_verlauf: (+row.schwerer_verlauf) || 1e-9,
  stationaer: (+row.stationaer - +row.schwerer_verlauf) || 1e-9,
  genesene: -row.genesene,
  infizierte: +row.erkrankte - +row.genesene - +row.stationaer - +row.tote
})).then(data => {
  svg
    .attr('width', shared.overallWidth)
    .attr('height', shared.overallHeight)
    .attr('viewBox', [-margin.left, -margin.top, shared.overallWidth, shared.overallHeight])
    .attr('xmlns', 'http://www.w3.org/2000/svg')

  // Transpose the data into layers
  const stack = d3.stack()
    .keys(categories.map(c => c.key))
    .order(d3.stackOrderstackOrderNone)
    .offset(d3.stackOffsetDiverging)
  const datasets = stack(data)

  const x = d3.scaleLinear().domain([d3.min(data, d => d.date), d3.max(data, d => d.date)]).range([0, width])
  const y1 = d3.scaleLinear().domain([d3.min(data, d => d.genesene), d3.max(data, d => d.infizierte)]).nice().range([height, 0])

  const area = d3.area()
    .x((d, i) => x(d.data.date))
    .y0(d => y1(d[0]))
    .y1(d => y1(d[1]))

  svg.append('g').attr('class', 'x axis')
    .attr('transform', `translate(0,${height})`)
    .style('color', '#bbb')
    .style('font-size', 13)
    .call(d3.axisBottom(x).tickFormat(toDate))
    .selectAll('text')
    .attr('color', 'black')

  svg.append('g')
    .attr('class', 'areas')
    .selectAll('areas')
    .data(datasets).enter()
    .append('path')
    .attr('fill', (d, i) => categories[i].color)
    .attr('d', d => area(d))

  svg.append('g').attr('class', 'y axis')
    .attr('transform', `translate(${width},0)`)
    .style('color', '#bbb')
    .style('font-size', 13)
    .call(d3.axisRight(y1))
    .call(g => g.selectAll('.tick line')
      .attr('x2', -width))
    .selectAll('text')
    .attr('color', 'black')

  svg.append('text')
    .text('Coronafälle Jena')
    .style('font-size', 18)
    .style('dominant-baseline', 'central')
    .style('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', -margin.top / 2)

  const lw = width / categories.length
  const ofst = 8
  const offsetPos = [0, lw - ofst, 2 * lw - 2 * ofst, 3 * lw - 3 * ofst, 4 * lw - 4 * ofst]
  const offsetWidth = [lw - ofst, lw - ofst, lw - ofst, lw - ofst, lw + 4 * ofst]

  svg.append('g')
    .attr('class', 'legend')
    .selectAll('entries')
    .data([ categories[1], categories[0], ...categories.slice(2) ])
    .enter().append('g')
    .each((d, i, g) => d3.select(g[i])
      .attr('transform', `translate(${offsetPos[i]}, ${height + margin.bottom / 2 - 9})`)
      .call(g => g.append('rect')
        .attr('width', offsetWidth[i])
        .attr('height', 17)
        .style('fill', d.color))
      .call(g => g.append('text')
        .attr('x', 3)
        .attr('y', 3)
        .text(`${d.name}: ${Math.abs(data[data.length - 1][d.key])}`)
        .style('dominant-baseline', 'hanging')
        .style('font-size', 13)
        .style('fill', ['white', 'white', 'white', 'black', 'black'][i])))
  svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${offsetPos[2]}, ${height + margin.bottom / 2 + 8})`)
    .call(g => g.append('rect')
      .attr('width', offsetWidth[2] + offsetWidth[3] + offsetWidth[4])
      .attr('height', 17)
      .style('fill', 'yellow'))
    .call(g => g.append('text')
      .attr('x', (offsetWidth[2] + offsetWidth[3] + offsetWidth[4]) / 2)
      .attr('y', 3)
      .text(`SARS-CoV-2 positiv getestet gesamt: ${data[data.length - 1]['infizierte'] + data[data.length - 1]['stationaer'] + data[data.length - 1]['schwerer_verlauf']}`)
      .style('dominant-baseline', 'hanging')
      .style('text-anchor', 'middle')
      .style('font-size', 13)
      .style('fill', 'black'))

  svg.append('text')
    .text('🄯2019 hoffis-eck.de/jenaCorona')
    .style('fill', '#bbb')
    .style('font-family', 'sans-serif')
    .style('dominant-baseline', 'middle')
    .style('text-anchor', 'middle')
    .style('font-size', '10')
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
      shared.addDownloadButton('Jena-alt', canvas)
      shared.addShareButton('Jena-alt', canvas)
    })
})
