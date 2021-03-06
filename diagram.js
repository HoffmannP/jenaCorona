/* globals d3 */

import * as shared from './shared.js'
import deDE from './local.de_DE.js'

const source = decodeURI(document.location.search.substr(1)) || 'Jena'

export const margin = {
  left: 45,
  top: 45,
  right: 54,
  bottom: 85
}
export const width = shared.overallWidth - margin.left - margin.right
export const height = shared.overallHeight - margin.top - margin.bottom

const alpha = 0.5

const categories = [
  { name: 'Genesen', key: 'genesene', color: `rgba(  0, 128,   0, ${alpha})` },
  { name: 'Tot', key: 'tote', color: `rgba(0,     0,   0, ${alpha})` },
  { name: 'Infiziert', key: 'infizierte', color: `rgba(  0,   0, 255, ${alpha})` },
  { name: 'Stationär', key: 'stationaer', color: `rgba(255, 165,   0, ${alpha})` },
  { name: 'Schwerer Verlauf', key: 'schwerer_verlauf', color: `rgba(255,   0,   0, ${alpha})` }
]

function correctJenaMissMeasurement (func) {
  return function (row) {
    if (['1588784405', '1588870800'].includes(row.zeit)) {
      row.erkrankte = `${row.erkrankte - 1}`
    }
    return func(row)
  }
}

const withSign = c => `${c > 0 ? '+' : (c === 0 ? '±' : '')}${c}`

d3.timeFormatDefaultLocale(deDE.time)
d3.formatDefaultLocale(deDE.number)

const toDate = u => d3.timeFormat('%e.%m.')(new Date(u))
const timeParse = d3.timeParse('%d.%m.%Y %H:%M')

const quellen = {
  Jena: {
    url: 'jena.csv',
    prepare: correctJenaMissMeasurement(row => ({
      zeit: row.zeit * 1000,
      tote: -row.tote || -1e-9,
      schwerer_verlauf: (+row.schwerer_verlauf) || 1e-9,
      stationaer: (+row.stationaer - +row.schwerer_verlauf) || 1e-9,
      genesene: -row.genesene || 1e-9,
      infizierte: +row.erkrankte - +row.genesene - +row.stationaer - +row.tote,
      aktiv: +row.erkrankte || 1e-9,
      ansteckend: +row.erkrankte - +row.genesene - +row.tote
    }))
  },
  Thüringen: {
    url: 'thueringen.csv',
    prepare: row => {
      const rateNochAktiv = (+row.erkrankte - +row.genesene - +row.tote) / +row.erkrankte
      const stationär = Math.round((+row.stationaer - +row.schwerer_verlauf) * rateNochAktiv)
      const schwererVerlauf = Math.round(+row.stationaer * rateNochAktiv)
      return {
        zeit: timeParse(row.veroeffentlichung),
        tote: -row.tote || -1e-9,
        schwerer_verlauf: schwererVerlauf || 1e-9,
        stationaer: stationär || 1e-9,
        genesene: -row.genesene || 1e-9,
        infizierte: +row.erkrankte - +row.genesene - stationär - schwererVerlauf - +row.tote,
        aktiv: +row.erkrankte || 1e-9,
        ansteckend: +row.erkrankte - +row.genesene - +row.tote
      }
    }
  }
}

const svg = d3.create('svg')
  .style('font-family', 'sans-serif')

const getData = quelleSelect => d3.csv(quellen[quelleSelect].url, quellen[quelleSelect].prepare)

const mittelVier = (d, i) => d[i].ansteckend + d[i - 1].ansteckend + d[i - 2].ansteckend + d[i - 3].ansteckend

Promise.all([shared.calcFontSize(), getData(source)]).then(([fontSizeRatio, data]) => {
  const fs = {
    _18: `${18 / fontSizeRatio}px`,
    _13: `${13 / fontSizeRatio}px`,
    _10: `${10 / fontSizeRatio}px`
  }
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

  // Calculate R
  const rate = data.map(
    (v, i, d) => i > 7
      ? {
        zeit: v.zeit,
        Reff: mittelVier(d, i - 4) === 0 ? 0 : mittelVier(d, i) / mittelVier(d, i - 4),
        rate: Math.max(0, v.ansteckend - d[i - 1].ansteckend) / d[i - 1].ansteckend
      }
      : undefined
  ).slice(8)

  const newest = {
    ...data[data.length - 1],
    Reff: rate[rate.length - 1].Reff,
    rate: rate[rate.length - 1].rate,
    count: data[data.length - 1].aktiv - data[data.length - 2].aktiv
  }

  const x = d3.scaleLinear().domain([d3.min(data, d => d.zeit), d3.max(data, d => d.zeit)]).range([0, width])
  const y1 = d3.scaleLinear().domain([d3.min(data, d => d.genesene + d.tote), d3.max(data, d => d.infizierte + d.stationaer + d.schwerer_verlauf)]).nice().range([height, 0])
  const y2 = d3.scaleLinear().domain([d3.min(rate, d => d.Reff), d3.max(rate.slice(5), d => d.Reff)]).nice().range([height, 0]).clamp(true)

  const area = d3.area()
    .x((d, i) => x(d.data.zeit))
    .y0(d => y1(d[0]))
    .y1(d => y1(d[1]))

  svg.append('g').attr('class', 'x axis')
    .attr('transform', `translate(0,${height})`)
    .style('color', '#bbb')
    .style('font-size', fs._13)
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

  svg.append('path')
    .attr('class', 'lines')
    .datum(rate)
    .attr('fill', 'none')
    .attr('stroke', `rgb(128,   0, 128, ${(0.5 + alpha / 2)})`)
    .attr('stroke-width', 2)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('d', d3.line()
      .x(d => x(d.zeit))
      .y(d => y2(d.Reff)))

  svg.append('rect')
    .attr('x', -1)
    .attr('y', -1)
    .attr('height', 1)
    .attr('width', width / 2)
    .attr('fill', 'white')

  svg.append('g').attr('class', 'y1 axis')
    .attr('transform', `translate(${width},0)`)
    .style('color', '#bbb')
    .style('font-size', fs._13)
    .call(d3.axisRight(y1).tickFormat(d3.format(',')))
    .call(g => g.selectAll('.tick line')
      .attr('x2', -width))
    .selectAll('text')
    .attr('color', 'black')

  svg.append('g').attr('class', 'y2 axis')
    .attr('transform', `translate(0,0)`)
    .style('color', '#bbb')
    .style('font-size', fs._13)
    .call(d3.axisLeft(y2).tickFormat(d3.format('.2')))
    .selectAll('text')
    .attr('color', 'black')

  svg.append('text')
    .text(`Coronafälle ${source}`)
    .style('font-size', fs._18)
    .style('dominant-baseline', 'middle')
    .style('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', -27)

  if (source === 'Thüringen') {
    svg.append('text')
      .attr('fill', 'grey')
      .text(`* Zahlen anhand der Aktivenrate geschätzt`)
      .style('font-size', fs._10)
      .style('dominant-baseline', 'middle')
      .style('text-anchor', 'end')
      .attr('x', shared.overallWidth - margin.right - margin.left)
      .attr('y', shared.overallHeight - margin.top - 10)
  }

  const lw = width / categories.length
  const ofst = 8
  const offsetPos = [0, lw - 3 * ofst, 2 * lw - 2 * ofst, 3 * lw - 3 * ofst, 4 * lw - 4 * ofst]
  const offsetWidth = [lw - 3 * ofst, lw + 1 * ofst, lw - ofst, lw - ofst, lw + 4 * ofst]

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
        .attr('y', 9)
        .text(`${d.name}: ${Math.round(Math.abs(newest[d.key]))}${i > 2 && source === 'Thüringen' ? '*' : ''}`)
        .style('dominant-baseline', 'middle')
        .style('font-size', fs._13)
        .style('fill', ['white', 'white', 'white', 'black', 'black'][i])))
  svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(0, ${height + margin.bottom / 2 + 8})`)
    .call(g => g.append('rect')
      .attr('width', offsetWidth[0] + offsetWidth[1])
      .attr('height', 17)
      .style('fill', `rgb(128,   0, 128, ${alpha})`))
    .call(g => g.append('text')
      .attr('x', 3)
      .attr('y', 9)
      .text(`Reproduktionszahl: ${d3.format('.2')(newest.Reff)} / ${withSign(newest.count)}`)
      .style('dominant-baseline', 'middle')
      .style('font-size', fs._13)
      .style('fill', 'white'))
  svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${offsetPos[2]}, ${height + margin.bottom / 2 + 8})`)
    .call(g => g.append('rect')
      .attr('width', offsetWidth[2] + offsetWidth[3] + offsetWidth[4])
      .attr('height', 17)
      .style('fill', `rgba(255, 255,   0, ${alpha})`))
    .call(g => g.append('text')
      .attr('x', (offsetWidth[2] + offsetWidth[3] + offsetWidth[4]) / 2)
      .attr('y', 9)
      .text(`SARS-CoV-2 positiv getestet gesamt: ${newest.ansteckend}`)
      .style('dominant-baseline', 'middle')
      .style('text-anchor', 'middle')
      .style('font-size', fs._13)
      .style('fill', 'black'))

  shared.disclaimer(d3, svg, new Date(newest.zeit))
    .attr('x', width / 2)
    .attr('y', -9)

  document.body.appendChild(svg.node())
  svg.node().style.backgroundImage = `
    linear-gradient(
      rgba(255, 255, 255, 0.6),
      rgba(255, 255, 255, 0.6)
    ),
    url(${shared.bg})`
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

  Object.keys(quellen).filter(s => s !== source).map((s, i) => `${i > 0 ? '| ' : ''}<a href=?${s}>${s}</a>`).forEach(
    link => document.querySelector('.links').insertAdjacentHTML('beforeend', link)
  )
  shared.diagramToFile(svg, { x: margin.left, y: margin.top, w: width, h: height })
    .then(canvas => {
      shared.addDownloadButton(source, canvas)
      shared.addShareButton(source, canvas)
    })
})
