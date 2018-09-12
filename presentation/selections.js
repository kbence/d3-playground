function randomPercent(percentage) {
  return function() {
    return Math.random() < percentage/100;
  };
}

function gridScale(cols, rows, x, y, width, height) {
  return function(d, i) {
    var dx = i % cols;
    var dy = (i - dx) / cols;

    return {
      x: x + (dx / cols) * width,
      y: y + (dy / rows) * height,
    };
  };
}

function random(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

function randomColor() {
  return 'rgb(' + 'rgb'.split('').map(function() { return random(0, 256); }).join(', ') + ')';
}

function init() {
  var data = d3.range(0, 200),
      width = 800,
      height = 500,
      margin = 10,
      iconSize = 35,
      updateTime = 2000,
      radius = height * 0.45,
      transitionDuration = 1000;

  var svg = d3.select('.selections')
    .append('svg')
      .attr('width', width)
      .attr('height', height)
    .append('g');

  var grid = gridScale(20, 10, iconSize/2, iconSize/2, width - iconSize, height - iconSize);

  function update() {
    var color = randomColor();
    var nodes = svg.selectAll('g.node').data(data)
    var enterNodes = nodes.enter()
      .append('g')
        .attr('class', 'node');

    enterNodes.append('rect')
        .attr('x', function(d, i) { return grid(d, i).x; })
        .attr('y', function(d, i) { return grid(d, i).y; })
        .attr('width', iconSize)
        .attr('height', iconSize);

    nodes.filter(randomPercent(35)).select('rect')
      .transition()
        .duration(transitionDuration)
        .style('fill', color);
  }

  update();
  setInterval(update, updateTime);
}

d3.select(window).on('load', init);
