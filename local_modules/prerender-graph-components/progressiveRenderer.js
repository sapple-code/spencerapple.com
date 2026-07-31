'use strict';

function mark(rootDocument, selector, state) {
    var otherState = state === 'd3Enhanced' ? 'd3Prerendered' : 'd3Enhanced';

    Array.prototype.forEach.call(rootDocument.querySelectorAll(selector), function (element) {
        delete element.dataset[otherState];
        element.dataset[state] = 'true';
    });
}

module.exports = function progressiveRenderer(renderer, options) {
    var selector = options && options.selector ? options.selector : '.d3-chart';

    return function render(rootDocument) {
        renderer(rootDocument);
        mark(
            rootDocument,
            selector,
            typeof window === 'undefined' ? 'd3Prerendered' : 'd3Enhanced'
        );
    };
};

module.exports.markEnhanced = function markEnhanced(rootDocument, selector) {
    mark(rootDocument, selector, 'd3Enhanced');
};
