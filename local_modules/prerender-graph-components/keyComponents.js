'use strict';

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
        clickEvent = function (checked) { return null; };

    function my (selection) {

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

            clickEvent(checked);

            event.stopPropagation();
        });

    }

    my.size = function (_) {
        if(!arguments.length) return size;
        size = _;
        return my;
    }

    my.x = function (_) {
        if(!arguments.length) return x;
        x = _;
        return my;
    }

    my.y = function (_) {
        if(!arguments.length) return y;
        y = _;
        return my;
    }

    my.rx = function (_) {
        if(!arguments.length) return rx;
        rx = _;
        return my;
    }

    my.ry = function (_) {
        if(!arguments.length) return ry;
        ry = _;
        return my;
    }

    my.markStrokeWidth = function (_) {
        if(!arguments.length) return markStrokeWidth;
        markStrokeWidth = _;
        return my;
    }

    my.boxStrokeWidth = function (_) {
        if(!arguments.length) return boxStrokeWidth;
        boxStrokeWidth = _;
        return my;
    }

    my.checked = function (_) {
        if(!arguments.length) return checked;
        checked = _;
        return my;
    }

    my.clickEvent = function (_) {
        if(!arguments.length) return clickEvent;
        clickEvent = _;
        return my;
    }

    return my;
}

module.exports.colorRow = function colorRow () {
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

module.exports.checkBoxRow = function checkBoxRow () {
    var text = null,
        checked = false,
        clickFunction = function (checked) { return null; },
        startingValue = false;

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

            if (startingValue) {
                clickFunction(checked);
            }
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

    my.startingValue = function (_) {
        if(!arguments.length) return startingValue;
        startingValue = _;
        return my;
    };

    return my;
}

module.exports.key = function key () {
    const rowHeight = 20;
    const rowPadding = 5;
    let x = 0;
    let y = 0;
    let datum = [];

    function my (selection) {
        selection.datum(datum);

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

    my.datum = function (_) {
        if(!arguments.length) return datum;
        datum = _;
        return my;
    };

    return my;
}
