'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const buildDirectory = path.resolve(__dirname, '..', 'build');

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

const files = listFiles(buildDirectory);
const relativeFiles = new Set(
  files.map((filename) => path.relative(buildDirectory, filename))
);

for (const expected of [
  '404.html',
  'index.html',
  'content/traveling_on_a_budget/index.html',
  'content/traveling_on_a_budget/data/places.json',
  'content/traveling_on_a_budget/src/graphComponents.js',
  'content/visualizing_travel_effort/index.html',
  'content/visualizing_travel_effort/data/places.json',
  'content/visualizing_travel_effort/src/graphComponents.js'
]) {
  assert(relativeFiles.has(expected), `missing generated file: ${expected}`);
}

assert(!relativeFiles.has('content/traveling_on_a_budget/data/budget.csv'));
assert(files.length >= 34, `expected at least 34 generated files, got ${files.length}`);

const d3Bundle = fs.readFileSync(
  path.join(buildDirectory, 'content/traveling_on_a_budget/lib/d3.min.js'),
  'utf8'
);
assert.match(d3Bundle, /v7\.9\.0/);

const budgetHtml = fs.readFileSync(
  path.join(buildDirectory, 'content/traveling_on_a_budget/index.html'),
  'utf8'
);
assert.match(budgetHtml, /id="totalDays">373</);
assert.match(budgetHtml, /id="totalSpent">\$35,205\.86</);
assert.equal((budgetHtml.match(/<svg/g) || []).length, 3);

const travelHtml = fs.readFileSync(
  path.join(buildDirectory, 'content/visualizing_travel_effort/index.html'),
  'utf8'
);
assert.equal((travelHtml.match(/<svg/g) || []).length, 7);

const budgetData = JSON.parse(
  fs.readFileSync(
    path.join(buildDirectory, 'content/traveling_on_a_budget/data/places.json'),
    'utf8'
  )
);
assert.equal(budgetData.totalDays, 373);
assert.equal(budgetData.places.length, 74);
assert.equal(budgetData.budgetPerCountry.length, 11);

for (const htmlFile of files.filter((filename) => filename.endsWith('.html'))) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  const dom = new JSDOM(html);
  const pagePath = `/${path.relative(buildDirectory, htmlFile)}`;

  for (const element of dom.window.document.querySelectorAll('[href], [src]')) {
    const value = element.getAttribute('href') || element.getAttribute('src');
    if (!value || /^(?:[a-z]+:|\/\/|#)/i.test(value)) {
      continue;
    }

    const pathname = decodeURIComponent(
      new URL(value, `https://spencerapple.test${pagePath}`).pathname
    );
    const target = path.join(buildDirectory, pathname);
    const exists =
      fs.existsSync(target) ||
      fs.existsSync(`${target}.html`) ||
      fs.existsSync(path.join(target, 'index.html'));
    assert(exists, `${pagePath} references missing local asset ${value}`);
  }

  dom.window.close();
}

console.log(`Smoke-tested ${files.length} generated files`);
