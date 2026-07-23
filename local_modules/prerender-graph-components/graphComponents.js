'use strict';

const utils = require('./utils');
const isNode = typeof window === 'undefined';

module.exports.drawText = function drawText () {
    var t = function (d) { return null; },
        dx = function (d) { return 0; },
        dy = function (d) { return 0; };

    function my (selection, remove) {
        selection.each(function (d, i) {

            // UPDATE (if remove === true, data is unset)
            var text = d3.select(this).selectAll("text")
                .data(function (d) { return remove ? [] : [d]; })
                .text(t)
                .attr("dx", dx)
                .attr("dy", dy);

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

function svg () {
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

module.exports.chartWithAxices = function chartWithAxices () {

    var svgComponent = svg(),
        margin = svgComponent.margin(),
        padding = {'top': 5, 'bottom': 5, 'left': 5, 'right': 5},
        width = svgComponent.width() - padding.left - padding.right,
        height = svgComponent.height() - padding.top - padding.bottom,
        xScaleGenerator = function (data, width, height) {
            console.assert(false, "xScaleGenerator:: not defined");
        },
        yScaleGenerator = function (data, width, height) {
            console.assert(false, "yScaleGenerator:: not defined");
        },
        dispatch = d3.dispatch('plot'),
        xTickFormat = null,
        yTickFormat = null,
        xLabel = null,
        yLabel = null,
        color = utils.randomColor;

    function my (selection) {
        selection.each(function (data, i) {
            let svg;
            let gComponent;

            if (!isNode) {
                svg = d3.select(this).select('svg');
                gComponent = svg.select('g');
            } else {
                svg = svgComponent(d3.select(this));
                gComponent = svg
                    .append('g')
                    .attr("class", "chart")
                    .attr("transform", "translate(" + (margin.left + padding.left) +
                       "," + (margin.top + padding.top) + ")");
            }

            var yScale = yScaleGenerator(data, width, height),
                xScale = xScaleGenerator(data, width, height);

            if (isNode) {
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
            }

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
