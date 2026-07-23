/* Seimei Matsusaki
   https://bl.ocks.org/Lulkafe/c77a36d5efb603e788b03eb749a4a714
   Reusable, pure d3 Checkbox */
function d3CheckBox () {

    var size = 20,
        x = 0,
        y = 0,
        rx = 0,
        ry = 0,
        markStrokeWidth = 3,
        boxStrokeWidth = 3,
        checked = false,
        clickEvent;

    function checkBox (selection) {

        var g = selection.append("g")
                .attr('class', 'checkbox'),
            box = g.append("rect")
                .attr("width", size)
                .attr("height", size)
                .attr("x", x)
                .attr("y", y)
                .attr("rx", rx)
                .attr("ry", ry)
                .style("cursor", "pointer")
                .style("fill-opacity", 0)
                .style("stroke-width", boxStrokeWidth)
                .style("stroke", "black");

        //Data to represent the check mark
        var coordinates = [
            {x: x + (size / 8), y: y + (size / 3)},
            {x: x + (size / 2.2), y: (y + size) - (size / 4)},
            {x: (x + size) - (size / 8), y: (y + (size / 10))}
        ];

        var line = d3.line()
            .x(function(d){ return d.x; })
            .y(function(d){ return d.y; });

        var mark = g.append("path")
            .attr("d", line(coordinates))
            .style("stroke-width", markStrokeWidth)
            .style("stroke", "black")
            .style("fill" , "none")
            .style("stroke-opacity", (checked)? 1 : 0);

        g.on("click", function (event) {
            checked = !checked;
            mark.style("stroke-opacity", (checked)? 1 : 0);

            if(clickEvent)
                clickEvent(checked);

            event.stopPropagation();
        });

    }

    checkBox.size = function (val) {
        size = val;
        return checkBox;
    }

    checkBox.x = function (val) {
        x = val;
        return checkBox;
    }

    checkBox.y = function (val) {
        y = val;
        return checkBox;
    }

    checkBox.rx = function (val) {
        rx = val;
        return checkBox;
    }

    checkBox.ry = function (val) {
        ry = val;
        return checkBox;
    }

    checkBox.markStrokeWidth = function (val) {
        markStrokeWidth = val;
        return checkBox;
    }

    checkBox.boxStrokeWidth = function (val) {
        boxStrokeWidth = val;
        return checkBox;
    }

    checkBox.checked = function (val) {

        if(val === undefined) {
            return checked;
        } else {
            checked = val;
            return checkBox;
        }
    }

    checkBox.clickEvent = function (val) {
        clickEvent = val;
        return checkBox;
    }

    return checkBox;
}

graphComponents.namespace('graphComponents.colorsRow');
graphComponents.colorRow = function () {
    var text = function (d) { return null; },
        color = function (d) { return "RGBA(23, 23, 23, 0)"; };

    function my (selection) {
        selection.each(function (data, i) {
            var row = d3.select(this)
                    .attr('class', 'colorRow'),
                displayText = row.selectAll('text')
                    .data([data]),
                rect = row.selectAll('rect')
                    .data([data]);

            displayText.enter().append('text')
                .attr('x', 20)
              .merge(displayText)
                .text(text);

            rect.enter().append('rect')
                .attr('y', -15)
                .attr('width', 16)
                .attr('height', 16)
              .merge(rect)
                .style('fill', color);
        });
    }

    my.text = function (_) {
        if(!arguments.length) return text;
        text = _;
        return my;
    };

    my.color = function (_) {
        if(!arguments.length) return color;
        color = _;
        return my;
    };

    return my;
}

graphComponents.namespace('graphComponents.checkBoxRow');
graphComponents.checkBoxRow = function () {
    var text = null,
        checked = false,
        clickFunction = function (checked) { return null; };

    function my (selection) {
        selection.each(function (data, i) {
            d3.select(this)
                .append('text')
                .attr('x', 20)
                .text(text);

            var checkBox = d3CheckBox()
                .size(16)
                .y(-15)
                .checked(checked)
                .clickEvent(clickFunction);

            d3.select(this).call(checkBox)
        });
    }

    my.text = function (_) {
        if(!arguments.length) return text;
        text = _;
        return my;
    };

    my.checked = function (_) {
        if(!arguments.length) return checked;
        checked = _;
        return my;
    };

    my.clickFunction = function (_) {
        if(!arguments.length) return clickFunction;
        clickFunction = _;
        return my;
    };

    return my;
}

graphComponents.namespace('graphComponents.key');
graphComponents.key = function () {
    var x = 0,
        y = 0,
        rowHeight = 20,
        rowPadding = 5;

    function my (selection) {
        selection.each(function (data, i) {
            var key = d3.select(this)
                .attr('class', 'key')
                .attr("transform", "translate(" + x + ',' + y + ')');

            var row = key
                .selectAll('g')
                .data(data)
                .enter().append('g')
                .attr('transform', function (d, i) {
                    return 'translate(0,' + (i * (rowHeight + rowPadding)) + ')'; })
                .each(function (rowObj, i) {
                    //rowObj.height(rowHeight); not implemented
                    d3.select(this).datum("already encoded").call(rowObj); });
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

    return my;
}

graphComponents.namespace('graphComponents.drawText');
graphComponents.drawText = function () {
    var t = function (d) { return null; },
        dx = function (d) { return 0; },
        dy = function (d) { return 0; };

    function my (selection, remove) {
        selection.each(function (d, i) {

            // UPDATE (the data based on remove)
            var text = d3.select(this).selectAll("text")
                .data(function (d) { return remove ? [] : [d]; });

            // EXIT
            text.exit().remove();

            // ENTER
            text.enter().append("text")
                .text(t)
                .attr("dx", dx)
                .attr("dy", dy);
        });
    }

    my.text = function (_) {
        if(!arguments.length) return t;
        t = _;
        return my;
    };

    my.dx = function (_) {
        if(!arguments.length) return dx;
        dx = _;
        return my;
    };

    my.dy = function (_) {
        if(!arguments.length) return dy;
        dy = _;
        return my;
    };

    return my;
}

graphComponents.namespace('graphComponents.svg');
graphComponents.svg = function () {
    var outerWidth = 900,
        outerHeight = 600,
        margin = {left: 50, right: 50, top: 30, bottom: 30},
        width = outerWidth - margin.left - margin.right,
        height = outerHeight - margin.top - margin.bottom,
        ratio = outerHeight / outerWidth,
        svg = null;

    function my (selection) {
       svg = selection
           .append('svg')
           .attr('preserveAspectRatio', 'xMinYMin meet')
           .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) +
               ' ' + (height + margin.top + margin.bottom));

       return svg;
    }

    my.ratio = function (_) {
        if(!arguments.length) return ratio;
        ratio = _;
        outerHeight = ratio * outerWidth;
        height = outerHeight - margin.top - margin.bottom;
        return my;
    };

    my.width = function (_) {
        if(!arguments.length) return width;
        width = _;
        return my;
    };

    my.height = function (_) {
        if(!arguments.length) return height;
        height = _;
        return my;
    };

    my.margin = function (_) {
        if(!arguments.length) return margin;
        margin = _;
        width = outerWidth - margin.left - margin.right;
        height = outerHeight - margin.top - margin.bottom;
        return my;
    };

    return my;
};

graphComponents.namespace('graphComponents.chartWithAxices');
graphComponents.chartWithAxices = function () {

    var svgComponent = graphComponents.svg(),
        margin = svgComponent.margin(),
        padding = {'top': 5, 'bottom': 5, 'left': 5, 'right': 5},
        width = svgComponent.width() - padding.left - padding.right,
        height = svgComponent.height() - padding.top - padding.bottom,
        xScaleGenerator = function (data, width, height) {
            graphComponents.assert(false, "xScaleGenerator:: not defined");
        },
        yScaleGenerator = function (data, width, height) {
            graphComponents.assert(false, "yScaleGenerator:: not defined");
        },
        //plot = function (selection, data, width, height, xScale, yScale) {
        //    return null;
        //},
        dispatch = d3.dispatch('plot'),
        xTickFormat = null,
        yTickFormat = null,
        xLabel = null,
        yLabel = null,
        color = graphComponents.randomColor;

    function my (selection) {
        selection.each(function (data, i) {
            // .call() returns the selection not it's return value
            var svg = svgComponent(d3.select(this)),
                gComponent = svg
                    .append('g')
                    .attr("class", "chart")
                    .attr("transform", "translate(" + (margin.left + padding.left) +
                       "," + (margin.top + padding.top) + ")");

            var yScale = yScaleGenerator(data, width, height),
                xScale = xScaleGenerator(data, width, height);

            // needs interior margins for the axis
            var xAxis = d3.axisBottom()
                .scale(xScale)
                .tickFormat(xTickFormat);

            var yAxis = d3.axisLeft()
                .scale(yScale)
                .tickFormat(yTickFormat);

            svg
                .append('g')
                .attr("transform", "translate(" + (margin.left + padding.left) + "," +
                    (height + margin.top + padding.top + padding.bottom) + ")")
                .classed('xAxis', true)
                .classed('axis', true)
                .call(xAxis);

            svg
                .append('g')
                .attr("transform", "translate(" + margin.left + "," + (margin.top + padding.top) + ")")
                .classed('yAxis', true)
                .classed('axis', true)
                .call(yAxis);

            // draw labels
            svg.select('.xAxis')
                .append('text')
                .classed('label', true)
                .text(xLabel)
                .attr('x', width / 2)
                .attr('y', margin.bottom / 2)
                .style('text-anchor', "middle");

            svg.select('.yAxis')
                .append('text')
                .classed('label', true)
                .text(yLabel)
                .attr("transform", "rotate(-90)")
                .attr('x', -1 * (height / 2))
                .attr('y', -1 * (margin.left - 35))
                .style('text-anchor', "middle");

            //gComponent.call(plot, data, width, height, xScale, yScale);
            dispatch.call("plot", gComponent.node(), data, width, height, xScale, yScale);
        });
    }

    my.getSVGComponent = function (_) {
        return svgComponent;
    };

    my.margin = function (_) {
        if(!arguments.length) return margin;
        margin = _;
        svgComponent.margin(_);
        width = svgComponent.width() - padding.left - padding.right;
        height = svgComponent.height() - padding.top - padding.bottom;
        return my;
    };

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

    my.onPlot = function (typename, callback) {
        if(!arguments.length) return dispatch.on();
        if(arguments.length === 1) return dispatch.on('plot.' + typename);
        dispatch.on('plot.' + typename, callback);
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

graphComponents.namespace('graphComponents.barChart');
graphComponents.barChart = function () {

    var chartWithAxices = graphComponents.chartWithAxices(),
        barPadding = 0.05,
        color = graphComponents.randomColor,
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

        svg = chartWithAxices.getSVGComponent(),
        drawText = graphComponents.drawText()
                       .text(function (d) { return null; })
                       .dy(function(d) { return -10; }),

        key = function (data, width, height, xScale, yScale) {
                  var selection = d3.select(this),
                      graphKey = graphComponents.key().x(width - 80).y(10),
                      // a blank color row to update later
                      datum = [graphComponents.colorRow()];

                  selection
                      .append('g')
                      .datum(datum)
                      .call(graphKey); };

    // barCharts should have a y label
    chartWithAxices.margin({left: 80, right: 30, top: 30, bottom: 50});

    function my (selection) {
        chartWithAxices
            .xScaleGenerator(xScaleGenerator)
            .yScaleGenerator(yScaleGenerator)
            .yTickFormat(yTickFormat)
            .xLabel(xLabel)
            .yLabel(yLabel)
            .onPlot('barChart', function (data, width, height, xScale, yScale) {

                drawText
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

                        return xScale.bandwidth() / 2; });

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
                    .style("fill", function (d) { return color(d); } )
                    .on("mouseenter", function (d) {
                        selection.select('.key .colorRow')
                            .datum(d)
                            .call(graphComponents.colorRow()
                                      .text(d.country)
                                      .color(countryColors[d.country]));

                        selection.selectAll('g')
                            .classed("highlight", false);
                        d3.select(this.parentNode)
                            .classed("highlight", true)
                            .raise(); })
                    .on("mouseleave", function (d) {
                        // nullify the color key
                        selection.select('.key .colorRow')
                            .datum(d)
                            .call(graphComponents.colorRow());

                        d3.select(this.parentNode)
                            .classed("highlight", false) });

                // ENTER + UPDATE
                d3.select(this).selectAll('g')
                    .attr('transform', function (d, i) {
                        return "translate(" + xScale(x(d)) + "," + yScale(y(d)) + ")"; })
                    .call(drawText);

                selection.selectAll('rect')
                    .attr('height', function (d) { return height - yScale(y(d)); });

                // EXIT
                outputSelection
                    .exit().remove(); })

            .onPlot("key", key);

        selection.each(function (data, i) {
            //console.log('barChart:: ', data, i, this);

            d3.select(this)
                .attr("class", "barChart")
                .call(chartWithAxices);
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
        if(!arguments.length) return drawText.text();
        drawText.text(_);
        return my;
    };

    my.key = function (_) {
        if(!arguments.length) return key;
        key = _;
        return my;
    };

    return my;
};


graphComponents.namespace('graphComponents.scatterplot');
graphComponents.scatterplot = function () {

    var chartWithAxices = graphComponents.chartWithAxices(),
        color = graphComponents.randomColor,
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
        svg = chartWithAxices.getSVGComponent(),

        drawText = graphComponents.drawText()
                       .text(function (d) { return null; })
                       .dx(function(d) {
                               var width = d3.select(this).node().getBBox().width,
                                   translate = d3.select(this.parentNode).attr("transform"),
                                   x = parseFloat(/[\d.]+,[\d.]+/.exec(translate)[0]),
                                   padding = r(d) + 2,
                                   hasSpace = x + padding + width < svg.width();

                               if (!hasSpace)
                                   padding = -1 * (padding + width);

                               return padding;
                           }),

        startingState = function (keyRows) {
            var lineRow = keyRows[1],
                clickFunction = lineRow.clickFunction();

            // set the line to invisible
            clickFunction(false);

            // set the box as unchecked
            lineRow.checked(false);

            return keyRows;
       };

    svg.ratio(0.55);
    chartWithAxices.margin({left: 80, right: 40, top: 30, bottom: 80});

    function my (selection) {
        chartWithAxices
            .xScaleGenerator(xScaleGenerator)
            .yScaleGenerator(yScaleGenerator)
            .xTickFormat(xTickFormat)
            .yTickFormat(yTickFormat)
            .xLabel(xLabel)
            .yLabel(yLabel)
            .onPlot("scatterplot", function (data, width, height, xScale, yScale) {
                var selection = d3.select(this);
                var outputSelection = selection
                    .selectAll('g')
                    .data(data)
                    .enter().append('g')
                    .attr('transform', function (d) {
                        return 'translate(' + xScale(x(d)) + ',' + yScale(y(d)) + ')'; })

                    .call(drawText);

                var circle = outputSelection
                    .append('circle')
                    .attr('class', 'point')
                    .attr('r', function (d) { return r(d); })
                    .style('fill', function (d) { return color(d);} )

                    .on('mouseenter', function (d) {
                        selection.select('.key .colorRow')
                            .datum(d)
                            .call(graphComponents.colorRow()
                                      .text(d.country)
                                      .color(countryColors[d.country]));

                        selection.selectAll('g')
                            .classed('highlight', false);
                        d3.select(this.parentNode)
                            .classed('highlight', true)
                            .raise(); })
                    .on('mouseleave', function (d) {
                        // nullify the color key
                        selection.select('.key .colorRow')
                            .datum(d)
                            .call(graphComponents.colorRow());

                        d3.select(this.parentNode)
                            .classed('highlight', false) });
            })
            .onPlot("linegraph", function (data, width, height, xScale, yScale) {
                var line = d3.line()
                    .x(function (d) { return xScale(x(d)); })
                    .y(function (d) { return yScale(y(d)); })
                    .curve(d3.curveMonotoneX);

                d3.select(this)
                    .append('path')
                    .datum(data)
                    .attr('class', 'line')
                    .attr('d', line)
            })
            .onPlot("key", function (data, width, height, xScale, yScale) {
                var selection = d3.select(this),
                    graphKey = graphComponents.key().x(width - 80).y(10),
                    datum = [
                        graphComponents.checkBoxRow()
                            .text('Points')
                            .checked(true)
                            .clickFunction(function (checked) {
                                selection.selectAll('.point')
                                    .style('visibility', checked ? 'visible': 'hidden'); }),
                        graphComponents.checkBoxRow()
                            .text('Line')
                            .checked(true)
                            .clickFunction(function (checked) {
                                selection.selectAll('.line')
                                    .style('visibility', checked ? 'visible': 'hidden'); }),
                        graphComponents.colorRow()
                    ];

                datum = startingState(datum);

                selection
                    .append('g')
                    .datum(datum)
                    .call(graphKey)
            });

        selection.each(function (data, i) {
            //console.log('scatterplot:: ', data, i, this);

            d3.select(this)
                .attr("class", "scatterplot")
                .call(chartWithAxices);
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

    my.startingState = function (_) {
        if(!arguments.length) return startingState;
        startingState = _;
        return my;
    };

    my.hoverText = function (_) {
        if(!arguments.length) return drawText.text();
        drawText.text(_);
        return my;
    };

    return my;
};
