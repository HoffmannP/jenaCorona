export const dotfunc = {
  rect: function (el, x, squareWidth, name, color, axis) {
    el.join('rect')
      .attr('fill', color)
      .attr('width', 2 * squareWidth)
      .attr('height', 2 * squareWidth)
      .attr('x', d => x(d.date) - squareWidth)
      .attr('y', d => axis(d[name]) - squareWidth)
  },
  diamond: function (el, x, squareWidth, name, color, axis) {
    el.join('rect')
      .attr('fill', color)
      .attr('transform', d => `rotate(45, ${x(d.date)}, ${axis(d[name])})`)
      .attr('width', 2 * 0.8 * squareWidth)
      .attr('height', 2 * 0.8 * squareWidth)
      .attr('x', d => x(d.date) - 0.8 * squareWidth)
      .attr('y', d => axis(d[name]) - 0.8 * squareWidth)
  },
  dot: function (el, x, squareWidth, name, color, axis) {
    el.join('circle')
      .attr('fill', color)
      .attr('r', squareWidth)
      .attr('cx', d => x(d.date))
      .attr('cy', d => axis(d[name]))
  },
  triangle: function (el, x, squareWidth, name, color, axis) {
    el.join('polygon')
      .attr('fill', color)
      .attr('points', d => `
        ${x(d.date) - 1.732 * squareWidth * 0.66},${axis(d[name]) + 1.2 * squareWidth * 0.66}
        ${x(d.date)},${axis(d[name]) - 1.7 * squareWidth * 0.66}
        ${x(d.date) + 1.732 * squareWidth * 0.66},${axis(d[name]) + 1.2 * squareWidth * 0.66}
    `)
  },
  none: function (el, name, color, axis) {}
}

function line (name, { x, y }) {
  return d3.line()
    .defined(d => !isNaN(d[name]))
    .x(d => x(d.date))
    .y(d => y(d[name]))
}

export function lineWithDot (g, data, x, squareWidth, { name, axis }, { color, dot }) {
  g.append('path').datum(data)
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', 2)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('d', line(name, { x, y: axis }))
  g.selectAll('dots')
    .data(data.filter(d => d[name]))
    .call(dotfunc[dot], x, squareWidth, name, color, axis)
}
