'use strict';

const utils = require('./utils');
const keyComponents = require('./keyComponents');
const graphComponents = require('./graphComponents');
const isNode = typeof window === 'undefined';

module.exports.barChart = function () {

    var chart = graphComponents.chartWithAxices(),
        barPadding = 0.05,
        color = utils.randomColor,
        x = function (d) { return d; },
        y = function (d) { return d; },
        xScaleGenerator = function (data, width, height) {
            return d3.scaleBand()
                .domain(data.map(function (d) { return x(d); }))
                .range([0, width])
                .round(true)
                .paddingInner(barPadding); },
        yScaleGenerator = function (data, width, height) {
            return d3.scaleLinear()
                .domain([0, d3.max(data, function (d) { return y(d); })].reverse())
                .range([0, height])
                .nice(); },
        yTickFormat = null,
        yLabel = null,
        xLabel = null,

        barLabel = graphComponents.drawText()
                       .text(function (d) { return null; })
                       .dy(function(d) { return -10; }),

        key = keyComponents.key()
            .datum([keyComponents.colorRow()]);

    var svg = chart.getSVGComponent();

    svg.ratio(0.45);
    chart.margin({left: 80, right: 60, top: 30, bottom: 50});

    function my (selection) {
        chart
            .xScaleGenerator(xScaleGenerator)
            .yScaleGenerator(yScaleGenerator)
            .yTickFormat(yTickFormat)
            .xLabel(xLabel)
            .yLabel(yLabel)
            .onPlot('barChart-server', function (data, width, height, xScale, yScale) {
                if (!isNode) return;

                barLabel
                    .dx(xScale.bandwidth() / 2);

                var selection = d3.select(this);

                // DATA JOIN
                var outputSelection = selection
                    .selectAll('g')
                    .data(data);

                // ENTER
                var eachOutput = outputSelection
                    .enter().append('g');

                eachOutput
                    .append('rect')
                    .classed('outputRect', true)
                    .attr('width', xScale.bandwidth())
                    .style("fill", function (d) { return color(d); } );

                // ENTER + UPDATE
                d3.select(this).selectAll('g')
                    .attr('transform', function (d, i) {
                        return "translate(" + xScale(x(d)) + "," + yScale(y(d)) + ")"; })
                    .call(barLabel);

                selection.selectAll('rect')
                    .attr('height', function (d) { return height - yScale(y(d)); });

                // EXIT
                outputSelection
                    .exit().remove();
            })
            .onPlot('barChart-client', function (data, width, height, xScale, yScale) {
                if (isNode) return;

                // update bar label to not go out of bounds
                barLabel
                    .dx(function(d) {
                        var width = d3.select(this).node().getBBox().width,
                            length = 5 + width / 2,
                            translate = d3.select(this.parentNode).attr("transform"),
                            x = parseFloat(/[\d.]+,[\d.]+/.exec(translate)[0]),
                            maxRight = svg.width() + svg.margin().right,
                            maxLeft = 0 - svg.margin().left,
                            offSvgRight = (x + length) >= maxRight,
                            offSvgLeft = (x - length) <= maxLeft;

                        if (offSvgRight)
                            return maxRight - (length + x);

                        if (offSvgLeft) {
                            return maxLeft + (length - x);
                        }

                        return xScale.bandwidth() / 2;
                    });

                let bars = d3.select(this).selectAll('g').data(data);

                bars.call(barLabel);

                // update label to be invisible until highlighted
                bars.select('text')
                    .classed('invisible', true);

                bars.select('rect')
                    .on("mouseenter", function (d) {
                        selection.select('.key .colorRow')
                            .datum(d)
                            .call(keyComponents.colorRow()
                                      .text(d.country)
                                      .color(color(d)));

                        selection.selectAll('g')
                            .classed("highlight", false);
                        d3.select(this.parentNode)
                            .classed("highlight", true)
                            .raise(); })
                    .on("mouseleave", function (d) {
                        // nullify the color key
                        selection.select('.key .colorRow')
                            .datum(d)
                            .call(keyComponents.colorRow());

                        d3.select(this.parentNode)
                            .classed("highlight", false) });
            })
            .onPlot("key", function (data, width, height, xScale, yScale) {
                  var selection = d3.select(this),
                      graphKey = key.x(width - 80).y(10);

                  selection
                      .append('g')
                      .call(graphKey);
            });

        selection.each(function (data, i) {
            //console.log('barChart:: ', data, i, this);

            d3.select(this)
                .attr("class", "barChart")
                .call(chart);
        });
    }

    my.x = function (_) {
        if(!arguments.length) return x;
        x = _;
        return my;
    };

    my.y = function (_) {
        if(!arguments.length) return y;
        y = _;
        return my;
    };

    my.xScaleGenerator = function (_) {
        if(!arguments.length) return xScaleGenerator;
        xScaleGenerator = _;
        return my;
    };

    my.yScaleGenerator = function (_) {
        if(!arguments.length) return yScaleGenerator;
        yScaleGenerator = _;
        return my;
    };

    my.color = function (_) {
        if(!arguments.length) return color;
        color = _;
        return my;
    };

    my.yTickFormat = function (_) {
        if(!arguments.length) return yTickFormat;
        yTickFormat = _;
        return my;
    };

    my.xLabel = function (_) {
        if(!arguments.length) return xLabel;
        xLabel = _;
        return my;
    };

    my.yLabel = function (_) {
        if(!arguments.length) return yLabel;
        yLabel = _;
        return my;
    };

    my.hoverText = function (_) {
        if(!arguments.length) return barLabel.text();
        barLabel.text(_);
        return my;
    };

    my.key = function (_) {
        if(!arguments.length) return key;
        key = _;
        return my;
    };

    return my;
};


module.exports.scatterplot = function () {

    var chart = graphComponents.chartWithAxices(),
        color = utils.randomColor,
        x = function (d) { return d; },
        y = function (d) { return d; },
        r = function (d) { return 20; },
        xScaleGenerator = function (data, width, height) {
            return d3.scaleLinear()
                .domain([0, d3.max(data, function (d) { return x(d); })])
                .range([0, width])
                .nice(); },
        yScaleGenerator = function (data, width, height) {
            return d3.scaleLinear()
                .domain([0, d3.max(data, function (d) { return y(d); })].reverse())
                .range([0, height])
                .nice(); },
        xTickFormat = null,
        yTickFormat = null,
        xLabel = null,
        yLabel = null,

        key = keyComponents.key()
            .datum([keyComponents.colorRow()]),

        dotLabel = graphComponents.drawText()
                       .text(function (d) { return null; }),

        svg = chart.getSVGComponent();

    svg.ratio(0.45);
    chart.margin({left: 100, right: 60, top: 30, bottom: 100});

    function my (selection) {
        chart
            .xScaleGenerator(xScaleGenerator)
            .yScaleGenerator(yScaleGenerator)
            .xTickFormat(xTickFormat)
            .yTickFormat(yTickFormat)
            .xLabel(xLabel)
            .yLabel(yLabel)
            .onPlot("scatterplot-server", function (data, width, height, xScale, yScale) {
                if (!isNode) return;

                var selection = d3.select(this);
                var outputSelection = selection
                    .selectAll('g')
                    .data(data)
                    .enter().append('g')
                    .attr('transform', function (d) {
                        return 'translate(' + xScale(x(d)) + ',' + yScale(y(d)) + ')'; })

                    .call(dotLabel);

                // update label to be invisible until highlighted
                outputSelection.select('text')
                    .classed('invisible', true);

                var circle = outputSelection
                    .append('circle')
                    .attr('class', 'point')
                    .attr('r', function (d) { return r(d); })
                    .style('fill', function (d) { return color(d);} );
            })
            .onPlot("scatterplot-client", function (data, width, height, xScale, yScale) {
                if (isNode) return;

                // update labeling to not go out of bounds
                dotLabel
                    .dx(function (d) {
                        var width = d3.select(this).node().getBBox().width,
                            translate = d3.select(this.parentNode).attr("transform"),
                            x = parseFloat(/[\d.]+,[\d.]+/.exec(translate)[0]),
                            padding = r(d) + 2,
                            hasSpace = x + padding + width < svg.width();

                        if (!hasSpace)
                            padding = -1 * (padding + width);

                        return padding; });

                var outputSelection = d3.select(this)
                    .selectAll('g')
                    .data(data)
                    .call(dotLabel);

                var circle = outputSelection.select('circle')
                    .on('mouseenter', function (d) {
                        selection.select('.key .colorRow')
                            .datum(d)
                            .call(keyComponents.colorRow()
                                      .text(d.country)
                                      .color(color(d)));

                        selection.selectAll('g')
                            .classed('highlight', false);
                        d3.select(this.parentNode)
                            .classed('highlight', true)
                            .raise(); })
                    .on('mouseleave', function (d) {
                        // nullify the color key
                        selection.select('.key .colorRow')
                            .datum(d)
                            .call(keyComponents.colorRow());

                        d3.select(this.parentNode)
                            .classed('highlight', false) });
            })
            .onPlot("key-server", function (data, width, height, xScale, yScale) {
                if (!isNode) return;

                var selection = d3.select(this),
                    graphKey = key.x(width - 80).y(10);

                selection
                    .append('g')
                    .call(graphKey);
            });

        selection.each(function (data, i) {
            //console.log('scatterplot:: ', data, i, this);

            d3.select(this)
                .attr("class", "scatterplot")
                .call(chart);
        });
    }

    my.x = function (_) {
        if(!arguments.length) return x;
        x = _;
        return my;
    };

    my.y = function (_) {
        if(!arguments.length) return y;
        y = _;
        return my;
    };

    my.r = function (_) {
        if(!arguments.length) return r;
        r = _;
        return my;
    };

    my.xScaleGenerator = function (_) {
        if(!arguments.length) return xScaleGenerator;
        xScaleGenerator = _;
        return my;
    };

    my.xTickFormat = function (_) {
        if(!arguments.length) return xTickFormat;
        xTickFormat = _;
        return my;
    };

    my.yTickFormat = function (_) {
        if(!arguments.length) return yTickFormat;
        yTickFormat = _;
        return my;
    };

    my.xLabel = function (_) {
        if(!arguments.length) return xLabel;
        xLabel = _;
        return my;
    };

    my.yLabel = function (_) {
        if(!arguments.length) return yLabel;
        yLabel = _;
        return my;
    };

    my.color = function (_) {
        if(!arguments.length) return color;
        color = _;
        return my;
    };

    my.hoverText = function (_) {
        if(!arguments.length) return dotLabel.text();
        dotLabel.text(_);
        return my;
    };

    my.key = function (_) {
        if(!arguments.length) return key;
        key = _;
        return my;
    };

    return my;
};

module.exports.lineChart = function () {

    var chart = graphComponents.chartWithAxices(),
        x = function (d) { return d; },
        y = function (d) { return d; },
        r = function (d) { return 20; },
        xScaleGenerator = function (data, width, height) {
            return d3.scaleLinear()
                .domain([0, d3.max(data, function (d) { return x(d); })])
                .range([0, width])
                .nice(); },
        yScaleGenerator = function (data, width, height) {
            return d3.scaleLinear()
                .domain([0, d3.max(data, function (d) { return y(d); })].reverse())
                .range([0, height])
                .nice(); },
        xTickFormat = null,
        yTickFormat = null,
        xLabel = null,
        yLabel = null,
        svg = chart.getSVGComponent();

    svg.ratio(0.45);
    chart.margin({left: 90, right: 40, top: 30, bottom: 80});

    function my (selection) {
        chart
            .xScaleGenerator(xScaleGenerator)
            .yScaleGenerator(yScaleGenerator)
            .xTickFormat(xTickFormat)
            .yTickFormat(yTickFormat)
            .xLabel(xLabel)
            .yLabel(yLabel)
            .onPlot("line-server", function (data, width, height, xScale, yScale) {
                if (!isNode) return;

                var line = d3.line()
                    .x(function (d) { return xScale(x(d)); })
                    .y(function (d) { return yScale(y(d)); })
                    .curve(d3.curveMonotoneX);

                d3.select(this)
                    .append('path')
                    .datum(data)
                    .attr('class', 'line')
                    .attr('d', line);
            });

        selection.each(function (data, i) {
            //console.log('scatterplot:: ', data, i, this);

            d3.select(this)
                .attr("class", "scatterplot")
                .call(chart);
        });
    }

    my.x = function (_) {
        if(!arguments.length) return x;
        x = _;
        return my;
    };

    my.y = function (_) {
        if(!arguments.length) return y;
        y = _;
        return my;
    };

    my.r = function (_) {
        if(!arguments.length) return r;
        r = _;
        return my;
    };

    my.xScaleGenerator = function (_) {
        if(!arguments.length) return xScaleGenerator;
        xScaleGenerator = _;
        return my;
    };

    my.xTickFormat = function (_) {
        if(!arguments.length) return xTickFormat;
        xTickFormat = _;
        return my;
    };

    my.yTickFormat = function (_) {
        if(!arguments.length) return yTickFormat;
        yTickFormat = _;
        return my;
    };

    my.xLabel = function (_) {
        if(!arguments.length) return xLabel;
        xLabel = _;
        return my;
    };

    my.yLabel = function (_) {
        if(!arguments.length) return yLabel;
        yLabel = _;
        return my;
    };

    return my;
};
