'use strict';

const { render } = require('../../../client/books-reading-charts');

module.exports.renderCharts = function () {
  render(this.document);

  for (const element of this.document.querySelectorAll('.reading-chart')) {
    delete element.dataset.d3Enhanced;
    element.dataset.d3Prerendered = 'true';
  }
};
