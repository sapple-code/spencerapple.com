---
title: Preprocessing D3 Visualizations with Metalsmith and JSDom
author: Spencer Apple
layout: post.pug
publishDate: 2016-12-24 15:00
---

Inspired by Maciej Ceglowski's talk, [Deep-Fried Data](http://idlewords.com/talks/deep_fried_data.htm), I converted my client rendered D3 visualizations to server renderings.
Preprocessing the data visualizations on the server allows users without Javascript to see my wonderful bar charts and scatterplots.

Ceglowski writes:

> Publish your texts as text. Let the images be images. Put them behind URLs and then commit to keeping them there. A URL should be a promise. 

A fairly minor part of his talk, but it still made me think. 
I should make my content as distributable and archivable as possible.
SVG is more distributable and long lasting than D3 4.3.0. 
Also my website now won't be meaningless for those who disable Javascript.

### Architecture

My website is generated with Metalsmith, a static site generator written in Node.
Static site generators allow users to write content in Markdown and define their layouts in a templating language like [Pug](https://pugjs.org/api/getting-started.html).
Metalsmith reads the content files into memory then runs them through a series of plugins that transform the content files into HTML, CSS, and JS.
To finish the content is outputted to a build directory.
<img src="https://docs.google.com/drawings/d/1uEUX3ral9Nc5kFbGvvqwRJ30FtGCowD4q07yUDCxKTY/pub?w=662&amp;h=226">

In the standard way of creating data visualizations with D3, the webserver serves HTML, CSS, and JS.
Then each browser interprets the Javascript to draw the SVG images. 
<img src="https://docs.google.com/drawings/d/1ZbYeOlL9AjmTVy46sHlA-DcMfwvRGVeaDxpD6TSwews/pub?w=515&amp;h=175">
<div id="client-workflow"></div>

In order to preprocess my visualizations, I moved the Javascript interpretation onto the server.
<img src="https://docs.google.com/drawings/d/1gc3xJj4-4R2VhM29eQDt2zlohPsTQ9n4_sQC0oavViI/pub?w=627&amp;h=174">
<div id="server-workflow"></div>

### Building the Metalsmith Plugin 

The plugin, [metasmith-preprocess](https://github.com/splayemu/metalsmith-preprocess), runs JSDom and executes user defined Javascript to update html. 
JSDom is a Node implementation of the DOM; it's api allows you to do pretty much everything a normal browser DOM will do - such as append elements and add attributes to nodes.
For each html file, it looks for the file 'preprocess.js' in the same directory. 
The following directory structure will please metalsmith-preprocess.

```text
.
├── build.js
├── package.json
├── Readme.md
└── src
    ├── index.html
    ├── post1
    │   ├── index.html
    │   └── preprocess.js
    └── post2
        ├── index.html
        └── preprocess.js
```

The plugin reads the exported functions of each preprocess.js file and executes them in the context of JSDom.

To show a quick example:

We have post1/index.html like this:

```html
<body>
  <div id="toRender">Not Rendered</div>
</body>
```

And post1/preprocess.js like this:

```javascript
module.exports.updateText = function (query_selector) {
  el = query_selector('#toRender');
  el.innerHTML = 'This page was modified on the server';
}
```

1. Metalsmith-preprocess loads post1/index.html into JSDom
2. Then calls each exported function in post1/preprocess.js
3. updateText() merely changes the html to signify the html file was modified on the server
4. metalsmith-preprocess updates the in memory file contents of post1/index.html
5. Then metalsmith writes the file build/post1/index.html

For working examples, check out the [metasmith-preprocess tests](https://github.com/splayemu/metalsmith-preprocess/tree/master/test).

### Building the D3 Graphs

Creating the graphs on the server is very dandy, but in order to have complex dynamic effects, there does need to be Javascript running on the client as well.
I solved that by running the same code both on the client and server.
The graph generation code [detects if it's running in Node](https://www.npmjs.com/package/detect-node) and, if it's running on the server, creates the SVG element and axices. 
If running on the client, it loads in the svg element already created and then adds dynamic effects.

Following Mike Bostocks' [Towards Reusable Charts](https://bost.ocks.org/mike/chart/), I wanted to create an easy to use and reusable component to generate graphs for my data visualizations. 

The important chunk of code is the chartWithAxices component below. 
It follows the D3 method chaining style and accepts functions as parameters to generate the X and Y scales.
Notice that the actual d3 scales are created here and are used to create the axices, then are passed to the plot callbacks in order to help render the graphs. 

```javascript
// chartWithAxices creates an svg chart with the x and y axices
module.exports.chartWithAxices = function () {
    // local variables that can be retrieved and set with functions
    var svgComponent = graphComponents.svg(),
        xScaleGenerator = function (data, width, height) {
            graphComponents.assert(false, "xScaleGenerator:: not defined");
        },
        yScaleGenerator = function (data, width, height) {
            graphComponents.assert(false, "yScaleGenerator:: not defined");
        },
        dispatch = d3.dispatch('plot'),
        ...

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
                // create the axices
                var xAxis = d3.axisBottom()
                    .scale(xScale);

                var yAxis = d3.axisLeft()
                    .scale(yScale)

                // draw the axices
                svg
                    .append('g')
                    .attr("transform", "translate(" + ... + ")")
                    .call(xAxis);

                svg
                    .append('g')
                    .attr("transform", "translate(" + ... + ")")
                    .call(yAxis);

                // draw labels
                ...
            }

            dispatch.call("plot", gComponent.node(), data, width, height, xScale, yScale);
        });
    }
    // getters and setters (method chaining style) go here

    return my;
};
```

#### Building a Bar Chart with chartWithAxices

By registering multiple plot functions, it's easy to split the server and client code.

```javascript
module.exports.barChart = function () {
    var chartWithAxices = graphComponents.chartWithAxices(),
        barPadding = 0.05,
        x = function (d) { return d; },
        y = function (d) { return d; },
        // default barChart scales that can be overwritten
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
        ...

    function my (selection) {
        chartWithAxices
            .xScaleGenerator(xScaleGenerator)
            .yScaleGenerator(yScaleGenerator)
            // render the graph
            .onPlot('barChart-server', function (data, width, height, xScale, yScale) {
                if (!isNode) return;

                var selection = d3.select(this);
                var outputSelection = selection
                    .selectAll('g')
                    .data(data);

                var eachOutput = outputSelection
                    .enter().append('g');

                eachOutput
                    .append('rect')
                    .attr('width', xScale.bandwidth());

                d3.select(this).selectAll('g')
                    .attr('transform', function (d, i) {
                        return "translate(" + xScale(x(d)) + "," + yScale(y(d)) + ")"; });

                selection.selectAll('rect')
                    .attr('height', function (d) { return height - yScale(y(d)); });

                outputSelection
                    .exit().remove();
            })
            // add dynamic highlighting effects
            .onPlot('barChart-client', function (data, width, height, xScale, yScale) {
                if (isNode) return;

                d3.select(this).selectAll('g')
                    .data(data);
                    .select('rect')
                    .on("mouseenter", function (d) {
                        selection.selectAll('g')
                            .classed("highlight", false);
                        d3.select(this.parentNode)
                            .classed("highlight", true)
                    .on("mouseleave", function (d) {
                        // nullify the color key
                        selection.select('.key .colorRow')
                            .datum(d)
                            .call(keyComponents.colorRow());

                        d3.select(this.parentNode)
                            .classed("highlight", false) });
            });

        selection.each(function (data, i) {
            d3.select(this)
                .attr("class", "barChart")
                .call(chartWithAxices);
        });
    }
    // getters and setters (method chaining style) go here

    return my;
};
```

#### Using the Components

Now to actually use the barChart component, you provide accessor functions for each of the graph properties.
To keep everything consistent and simple, the client and server components use the same api and data.

```javascript
const serverClientCharts = require('prerender-graph-components')

const budgetPerCountry = serverClientCharts.barChart()
    .x(function (d) { return d.key; })
    .y(function (d) { return d.value.averageDailySpent; })
    .yTickFormat(d3.format("$,"))
    .yLabel('Average Daily Spending')
    .color(function (d) { return data.countryColors[d.key]; })
    .hoverText(function (d) { return twoDecimalRound(d.value.averageDailySpent); });

// when using jsdom to prerender visualizations, need to select the document first
d3.select(this.document).select('#budgetByCountry')
    .datum(data.budgetPerCountry)
    .call(budgetPerCountry)
```

I used browserify to create the client side script and exposed the global variable prerenderGraphComponents.

```javascript
const budgetPerCountry = prerenderGraphComponents.barChart()
    .x(function (d) { return d.key; })
    .y(function (d) { return d.value.averageDailySpent; })
    .yTickFormat(d3.format("$,"))
    .yLabel('Average Daily Spending')
    .color(function (d) { return data.countryColors[d.key]; })
    .hoverText(function (d) { return twoDecimalRound(d.value.averageDailySpent); });

d3.select('#budgetByCountry')
    .datum(data.budgetPerCountry)
    .call(budgetPerCountry)
```

Check out the full code here: [prerender-graph-components](https://github.com/splayemu/spencerapple.com/tree/master/local_modules/prerender-graph-components)

### Conclusions

Putting it all together, the preprocess plugin provides a way to invoke the server side renderings.
My D3 graph component code provides an api to generate graphs on the server and add dynamic effects on the client.

The split between the client and the server is done by convention. This lets the user break my code by failing to keep the client and server code/data consistent.
