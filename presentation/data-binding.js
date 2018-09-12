function randomPercent(percentage) {
  return function() {
    return Math.random() < percentage/100;
  };
}

function gridScale(cols, rows, x, y, width, height) {
  return function(d, i) {
    var dx = i % cols;
    var dy = (i - dx) / cols;

    return 'translate (' + (x + (dx / cols) * width) + ', ' +
                           (y + (dy / rows) * height) + ')';
  };
}

function init() {
  var data = 'abcdefghijklmnopqrstuvwxyz0123456789'.split(''),
      width = 800,
      height = 500,
      margin = 10,
      dataIconSize = 35,
      updateTime = 3000,
      radius = height * 0.45,
      transitionDuration = 1000;

  var svg = d3.select('.binding')
    .append('svg')
      .attr('width', width)
      .attr('height', height)
    .append('g');

  function createBox(index, text, cls) {
    svg.append('rect')
        .attr('class', cls)
        .attr('x', width/3*index + margin)
        .attr('y', margin)
        .attr('width', width/3 - margin*2)
        .attr('height', height - margin*2)
    svg.append('text')
        .attr('class', cls)
        .attr('transform', 'rotate(-90) translate(' + (-height/2) + ', ' +
              (width / 6 *(index * 2 + 1) + margin*index) + ')')
        .text(text)
  }

  function createGrid(idx) {
    return gridScale(
      4, 10,
      dataIconSize + margin + width/3 * idx, dataIconSize + margin,
      width/3 - dataIconSize, height - 2*margin - dataIconSize
    );
  }

  createBox(0, 'ENTER', 'enter');
  createBox(1, 'UPDATE', 'update');
  createBox(2, 'EXIT', 'exit');

  var gridEnter = createGrid(0);
  var gridUpdate = createGrid(1);
  var gridExit = createGrid(2);

  function update(data) {
    var x = d3.scalePoint().domain(data).range([margin + dataIconSize/2, height - margin - dataIconSize/2]);
    var nodes = svg.selectAll('g.node').data(data, function(d) { return d; });
    var enterNodes = nodes.enter()
      .append('g')
        .attr('class', 'node');

    console.log(data.join(''));

    nodes.transition()
        .duration(transitionDuration)
        .ease(d3.easeCubicOut)
        .attr('transform', gridUpdate);

    enterNodes
      .transition()
        .duration(transitionDuration)
        .ease(d3.easeCubicOut)
        .attr('transform', gridEnter);

    enterNodes.append('rect')
        .attr('x', -dataIconSize/2)
        .attr('y', -dataIconSize/2)
        .attr('width', dataIconSize)
        .attr('height', dataIconSize)
        .attr('rx', 5)
        .attr('ry', 5);

    enterNodes.append('text')
        .text(function(d) { return d.toUpperCase(); });

    nodes.exit()
      .transition()
        .duration(transitionDuration)
        .ease(d3.easeCubicOut)
        .attr('transform', gridExit)
      .transition()
        .duration(transitionDuration)
        .style('opacity', 0)
      .remove()
  }

  function updateWithRandomNodes() {
    var randomNodes = d3.shuffle(data.filter(randomPercent(50)));
    update(randomNodes);
  }

  updateWithRandomNodes();
  setInterval(updateWithRandomNodes, updateTime);
}

d3.select(window).on('load', init);
