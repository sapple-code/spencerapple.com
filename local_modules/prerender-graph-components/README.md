Prerender-graph-components
===

D3 graphs that run on the server and client. Code is split to generate the graphs on the server and apply hover and other dynamic effects on the client.

## Why
Built to use with static site generators, such as Metalsmith, to prerender svg images. This allows people with Javascript disabled to still see the content!

## Usage
Use the same API for both the client and the server except for two differences:

### Server
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

### Client
```javascript
// include script in html, prerenderGraphComponents is a global variable

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

### Custom charts

Use `progressiveRenderer` when a post needs a custom D3 chart that does not fit
the built-in bar, scatter, or line components. The same renderer then runs at
build time and in the browser:

```javascript
const charts = require('prerender-graph-components');

const render = charts.progressiveRenderer(function (document) {
    // Render custom charts into document.
}, { selector: '.reading-chart' });

render(document);
```

Build-time charts receive `data-d3-prerendered="true"`. Browser rendering
replaces that marker with `data-d3-enhanced="true"`, which makes the rendering
lifecycle testable without prescribing a particular chart implementation.
