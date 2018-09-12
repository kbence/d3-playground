d3.select(window).on('load', init);

function compareByCommits(a, b) {
  return b.commits - a.commits;
}

function init() {
  var width = 800,
      height = 600,
      margin = {
        left: 50,
        top: 5,
        right: 5,
        bottom: 150,
      };

  var svg = d3.select('.commit-stats')
    .append('svg')
      .attr('width', width)
      .attr('height', height)
    .append('g');
  var xAxisGroup = svg.append('g');
  var yAxisGroup = svg.append('g');

  function showRepoChart(data) {
    data = data.sort(compareByCommits).slice(0, 50);
    var repoNames = d3.set(data, function(d) { return d.repo; }).values();
    var x = d3.scaleBand().domain(repoNames).range([margin.left, width - margin.right])
              .padding(0.1);
    var y = d3.scaleLinear().domain([0, d3.max(data, function(d) { return d.commits; })])
              .range([height - margin.bottom, margin.top]);
    var xAxis = d3.axisBottom().scale(x);
    var yAxis = d3.axisLeft().scale(y);

    svg.selectAll('rect.commit').data(data)
      .enter()
        .append('rect')
          .attr('class', 'commit')
          .attr('x', function(d) { return x(d.repo); })
          .attr('y', function(d) { return y(d.commits); })
          .attr('width', function(d) { return x.bandwidth(); })
          .attr('height', function(d) { return y(0) - y(d.commits); });

    xAxisGroup.append('g')
      .attr('transform', 'translate(0, ' + (height - margin.bottom) + ')')
      .call(xAxis)
        .selectAll('text')
          .style('text-anchor', 'end')
          .attr('transform', 'rotate(-45) translate(-5, -3)')


    yAxisGroup.append('g')
      .attr('transform', 'translate(' + (margin.left) + ', 0)')
      .call(yAxis)
  }

  d3.json('data/_index.json').then(showRepoChart);
}
