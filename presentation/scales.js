function init() {
  var width = 1400,
      height = 650,
      hStep = height/10,
      transitionDuration = 1000,
      easeFunction = d3.easeCubicOut,
      margin = {
        left: 150,
        top: 5,
        right: 150,
        bottom: 5
      },
      area = {
        x1: margin.left,
        y1: margin.top,
        x2: width - margin.right,
        y2: height - margin.bottom
      },
      bar = {
        width: width/12,
      },
      scales = {
        Linear: { func: function() { return d3.scaleLinear(); },
                  data: d3.range(0, 100, 5),
                  dataDomain: function() { return d3.extent(this.data); },
                  linearScale: function() { return d3.scaleLinear(); },
                  domain: [area.y1 + 2*hStep , area.y2 - 2*hStep],
                  range: [area.y1 + hStep, area.y2 - hStep] },
        Logarithmic: { func: function() { return d3.scaleLog(); },
                       data: d3.range(1, 500, 8),
                       dataDomain: function() { return d3.extent(this.data); },
                       linearScale: function() { return d3.scaleLinear(); },
                       domain: [area.y1 + hStep, area.y2 - 4*hStep],
                       range: [area.y1 + 3*hStep, area.y2 - 2*hStep] },
        Point: { func: function() { return d3.scalePoint(); },
                 data: 'abcdefghijklmnopqrstuvwxyz'.split(''),
                 dataDomain: function() { return this.data; },
                 linearScale: function() { return d3.scalePoint(); },
                 domain: [area.y1 + hStep, area.y2 - 3*hStep],
                 range: [area.y1 + 2*hStep, area.y2 - 4*hStep] },
      };

  var buttonGroup = d3.select('.buttons');

  var svg = d3.select('.scales')
    .append('svg')
      .attr('width', width)
      .attr('height', height)
    .append('g');

  var domainYAxis = d3.axisLeft(),
      rangeYAxis = d3.axisRight();

  function update(scale) {
    var extent = d3.extent(scale.data),
        domainYLin = scale.linearScale().domain(scale.dataDomain()).range(scale.domain),
        domainY = scale.func().domain(scale.dataDomain()).range(scale.domain),
        rangeY = scale.func().domain(scale.dataDomain()).range(scale.range),
        rangeYId = d3.scaleIdentity().domain(scale.range).range(scale.range);
        funnelX = d3.scaleLinear().range([area.x1 + bar.width, area.x2 - bar.width]),
        min = extent[0],
        max = extent[1];

    buttonGroup.selectAll('button').data(Object.keys(scales))
      .enter()
        .append('button')
          .text(function(d) { return d; })
          .on('click', function(d) { update(scales[d]); });

    var domainRect = svg.selectAll('rect.domain').data([scale]);
    domainRect.enter()
        .append('rect')
          .attr('class', 'domain')
          .attr('x', function(d) { return width + 5; })
          .attr('y', function(d) { return domainY(min); })
          .attr('width', function(d) { return bar.width; })
          .attr('height', function(d) { return domainY(max) - domainY(min); })
      .merge(domainRect)
        .transition()
          .duration(transitionDuration)
          .ease(easeFunction)
          .attr('x', function(d) { return area.x1; })
          .attr('y', function(d) { return domainY(min); })
          .attr('height', function(d) { return domainY(max) - domainY(min); });

    var rangeRect = svg.selectAll('rect.range').data([scale]);
    rangeRect.enter()
        .append('rect')
          .attr('class', 'range')
          .attr('x', function(d) { return width + 5; })
          .attr('y', function(d) { return rangeY(min); })
          .attr('width', function(d) { return bar.width; })
          .attr('height', function(d) { return rangeY(max) - rangeY(min); })
      .merge(rangeRect)
        .transition()
          .duration(transitionDuration)
          .ease(easeFunction)
          .attr('x', function(d) { return area.x2 - bar.width; })
          .attr('y', function(d) { return rangeY(min); })
          .attr('height', function(d) { return rangeY(max) - rangeY(min); });

    var funnelArea = d3.area()
          .x(function(d, i) { return funnelX(i); })
          .y0(function(d) { return d[0]; })
          .y1(function(d) { return d[1]; });
        funnelData = [
          [domainY(min), domainY(max)],
          [rangeY(min), rangeY(max)]
        ];
    var transitionFunnel = svg.selectAll('path.funnel').data([funnelData]);
    transitionFunnel.enter()
        .append('path')
          .attr('class', 'funnel')
          .attr('transform', 'translate(0, ' + (height + 5) + ')')
      .merge(transitionFunnel)
        .transition()
          .duration(transitionDuration)
          .ease(easeFunction)
          .attr('transform', 'translate(0, 0)')
          .attr('d', funnelArea);

    var transitionLines = svg.selectAll('line.transition').data(scale.data);
    transitionLines.enter()
        .append('line')
          .attr('class', 'transition')
      .merge(transitionLines)
        .transition()
          .delay(function(d, i, items) { return i / items.length * transitionDuration; })
          .duration(transitionDuration)
          .ease(easeFunction)
          .attr('x1', function(d) { return area.x1 + bar.width; })
          .attr('y1', function(d) { return domainYLin(d); })
          .attr('x2', function(d) { return area.x2 - bar.width; })
          .attr('y2', function(d) { return rangeY(d); });
    transitionLines.exit()
        .transition()
          .style('stroke-opacity', '0')
        .remove();

    domainYAxis.scale(domainYLin);
    var domainAxisGroup = svg.selectAll('g.domainYAxis');
    domainAxisGroup.data(['dummy'])
      .enter()
        .append('g')
          .attr('class', 'domainYAxis')
      .merge(domainAxisGroup)
        .transition()
          .duration(transitionDuration)
          .ease(easeFunction)
        .call(domainYAxis)
          .attr('transform', 'translate(' + (area.x1 - 5) + ', 0)');

    rangeYAxis.scale(rangeYId);
    var rangeAxisGroup = svg.selectAll('g.rangeYAxis');
    rangeAxisGroup.data(['dummy'])
      .enter()
        .append('g')
          .attr('class', 'rangeYAxis')
          .attr('transform', 'translate(' + (width + 5) + ', 0)')
      .merge(rangeAxisGroup)
        .transition()
          .duration(transitionDuration)
          .ease(easeFunction)
        .call(rangeYAxis)
          .attr('transform', 'translate(' + (area.x2 + 5) + ', 0)');
  }

  update(scales.Linear);
}

d3.select(window).on('load', init);
