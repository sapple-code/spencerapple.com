// global variable so clientside scripts can use as well
const graphs = require('./graphs');
const keyComponents = require('./keyComponents');
const progressiveRenderer = require('./progressiveRenderer');

const prerenderGraphComponents = {
    'barChart': graphs.barChart,
    'scatterplot': graphs.scatterplot,
    'lineChart': graphs.lineChart,
    'key': keyComponents.key,
    'colorRow': keyComponents.colorRow,
    'checkBoxRow': keyComponents.checkBoxRow,
    'progressiveRenderer': progressiveRenderer,
    'markEnhanced': progressiveRenderer.markEnhanced
}

if (typeof window !== 'undefined') {
    window.prerenderGraphComponents = prerenderGraphComponents;
}

module.exports = prerenderGraphComponents;
