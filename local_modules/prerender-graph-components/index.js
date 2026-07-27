// global variable so clientside scripts can use as well
const graphs = require('./graphs');
const keyComponents = require('./keyComponents');

const prerenderGraphComponents = {
    'barChart': graphs.barChart,
    'scatterplot': graphs.scatterplot,
    'lineChart': graphs.lineChart,
    'key': keyComponents.key,
    'colorRow': keyComponents.colorRow,
    'checkBoxRow': keyComponents.checkBoxRow
}

if (typeof window !== 'undefined') {
    window.prerenderGraphComponents = prerenderGraphComponents;
}

module.exports = prerenderGraphComponents;
