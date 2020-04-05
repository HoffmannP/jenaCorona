/* globals d3 */

export const overallWidth = 605
export const overallHeight = 500
const margin = {
  left: 33,
  top: 52,
  right: 57,
  bottom: 78
}
const width = overallWidth - margin.left - margin.right
const height = overallHeight - margin.top - margin.bottom

console.log(width, height)

export const bg = 'images/bg5.jpg'
const alpha = 0.66
const colors = [
  `rgba(255,   0,   0, ${alpha})`,
  `rgba(255, 165,   0, ${alpha})`,
  `rgba(  0,   0, 255, ${alpha})`,
  `rgba(0,     0,   0, ${alpha})`,
  `rgba(  0, 128,   0, ${alpha})`
]

const toDate = u => d3.timeFormat('%e.%m.')(new Date(u))

const url = 'offiziell.csv'
const svg = d3.create('svg')
  .style('font-family', 'sans-serif')

export default svg.node()

d3.csv(url, row => ({
  date: 1000 * row.zeit,
  tote: -row.tote,
  schwerer_verlauf: (+row.schwerer_verlauf) || 1e-9,
  stationaer: (+row.stationaer - +row.schwerer_verlauf) || 1e-9,
  genesene: -row.genesene,
  erkrankte: +row.erkrankte - +row.genesene - +row.stationaer - +row.tote
})).then(data => {
  svg
    .attr('width', overallWidth)
    .attr('height', overallHeight)
    .attr('viewBox', [-margin.left, -margin.top, overallWidth, overallHeight])
    .attr('xmlns', 'http://www.w3.org/2000/svg')

  // Transpose the data into layers
  const stack = d3.stack()
    .keys(['schwerer_verlauf', 'stationaer', 'erkrankte', 'tote', 'genesene'])
    .order(d3.stackOrderReverse)
    .offset(d3.stackOffsetDiverging)
  const datasets = stack(data)

  const x = d3.scaleLinear().domain([d3.min(data, d => d.date), d3.max(data, d => d.date)]).range([0, width])
  const y1 = d3.scaleLinear().domain([d3.min(data, d => d.genesene), d3.max(data, d => d.erkrankte)]).nice().range([height, 0])

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
    .attr('fill', (d, i) => colors[i])
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

  const names = ['Schwerer Verlauf', 'Stationär', 'Infiziert', 'Gesund', 'Tote']
  const lw = width / names.length
  const ofst = 6

  svg.append('g')
    .attr('class', 'legend')
    .selectAll('entries')
    .data(names)
    .enter().append('g')
    .each((d, i, g) => d3.select(g[i])
      .call(g => g.append('rect')
        .attr('x', [0, lw + 4 * ofst, 2 * lw + 3 * ofst, 3 * lw + 2 * ofst, 4 * lw + ofst][i])
        .attr('y', height + margin.bottom / 2)
        .attr('width', [lw + 4 * ofst, lw - ofst, lw - ofst, lw - ofst, lw - ofst][i])
        .attr('height', 21)
        .style('fill', colors[i]))
      .call(g => g.append('text')
        .attr('x', 10 + [0, lw + 4 * ofst, 2 * lw + 3 * ofst, 3 * lw + 2 * ofst, 4 * lw + ofst][i])
        .attr('y', height + margin.bottom / 2 + 5)
        .text(names[i])
        .style('dominant-baseline', 'hanging')
        .style('font-size', 13)
        .style('fill', ['black', 'black', 'white', 'white', 'white'][i]))
    )

  svg.append('text')
    .text('🄯2019 hoffis-eck.de/jenaCorona')
    .style('fill', '#bbb')
    .style('font-family', 'sans-serif')
    .style('dominant-baseline', 'middle')
    .style('text-anchor', 'middle')
    .style('font-size', '10')
    .attr('x', width / 2)
    .attr('y', -9)
})
