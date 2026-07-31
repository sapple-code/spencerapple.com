'use strict';

const { render } = require('../../../client/books-reading-charts');

module.exports.renderCharts = function () {
  render(this.document);
};
