'use strict';

const d3 = require('d3');
const readingHistory = require('../src/drafts/the-books-ive-read/data/reading-history.json');

const genres = [
  'Fantasy',
  'Science fiction',
  'Science, history & society',
  'Health, family & memoir',
  'Literary & crime',
  'Work & technology',
  'Unclassified'
];

const colors = new Map(
  genres.map((genre, index) => [genre, d3.schemeTableau10[index]])
);

const books = readingHistory
  .filter((book) => book.readDate)
  .map((book) => ({
    ...book,
    readDateValue: d3.utcParse('%Y-%m-%d')(book.readDate),
    year: Number(book.readDate.slice(0, 4)),
    month: Number(book.readDate.slice(5, 7))
  }));

function clear(element) {
  d3.select(element).selectAll('*').remove();
}

function widthFor(element) {
  return Math.max(320, Math.floor(element.getBoundingClientRect().width || 672));
}

function appendSvg(element, width, height, label) {
  return d3
    .select(element)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'img')
    .attr('aria-label', label);
}

function appendLegend(element) {
  const legend = d3.select(element).append('ul').attr('class', 'legend');
  const items = legend.selectAll('li').data(genres).join('li');
  items
    .append('span')
    .attr('class', 'legend-swatch')
    .style('background-color', (genre) => colors.get(genre));
  items.append('span').text((genre) => genre);
}

function renderBooksByYear() {
  const element = document.querySelector('#books-by-year');
  if (!element) return;

  clear(element);
  appendLegend(element);

  const width = widthFor(element);
  const height = width < 480 ? 330 : 380;
  const margin = { top: 15, right: 14, bottom: 40, left: 42 };
  const years = d3.range(2020, 2027);
  const rows = years.map((year) => {
    const row = { year };
    for (const genre of genres) {
      row[genre] = books.filter(
        (book) => book.year === year && book.genre === genre
      ).length;
    }
    return row;
  });

  const stack = d3.stack().keys(genres)(rows);
  const x = d3
    .scaleBand()
    .domain(years)
    .range([margin.left, width - margin.right])
    .padding(0.24);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(rows, (row) => d3.sum(genres, (genre) => row[genre]))])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const svg = appendSvg(
    element,
    width,
    height,
    'Stacked bars showing books that count as read per year, split by broad genre.'
  );

  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));
  svg
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format('d')))
    .call((axis) => axis.select('.domain').remove());

  svg
    .append('g')
    .selectAll('g')
    .data(stack)
    .join('g')
    .attr('fill', (series) => colors.get(series.key))
    .selectAll('rect')
    .data((series) =>
      series.map((point) => ({ ...point, genre: series.key }))
    )
    .join('rect')
    .attr('x', (point) => x(point.data.year))
    .attr('y', (point) => y(point[1]))
    .attr('height', (point) => y(point[0]) - y(point[1]))
    .attr('width', x.bandwidth())
    .append('title')
    .text(
      (point) =>
        `${point.data.year}: ${point[1] - point[0]} ${point.genre.toLowerCase()} book${point[1] - point[0] === 1 ? '' : 's'}`
    );

  svg
    .append('g')
    .selectAll('text')
    .data(rows)
    .join('text')
    .attr('class', 'value-label')
    .attr('text-anchor', 'middle')
    .attr('x', (row) => x(row.year) + x.bandwidth() / 2)
    .attr('y', (row) => y(d3.sum(genres, (genre) => row[genre])) - 7)
    .text((row) => d3.sum(genres, (genre) => row[genre]));

  d3.select(element)
    .append('p')
    .attr('class', 'chart-note')
    .text('Based on 97 of 99 books that count as read: 41 use Finished Reading, 53 use Last Activity as a proxy, and 3 use Started Reading. Two books are undated. 2026 is partial through June 25.');
}

function renderAveragePages() {
  const element = document.querySelector('#average-pages-by-genre');
  if (!element) return;

  clear(element);
  const width = widthFor(element);
  const rowHeight = width < 480 ? 46 : 40;
  const height = genres.length * rowHeight + 55;
  const margin = {
    top: 10,
    right: 62,
    bottom: 35,
    left: width < 480 ? 122 : 145
  };
  const rows = genres
    .filter((genre) => genre !== 'Unclassified')
    .map((genre) => {
      const matches = readingHistory.filter((book) => book.genre === genre);
      const knownPages = matches.filter((book) => book.pages);
      return {
        genre,
        total: matches.length,
        known: knownPages.length,
        average: Math.round(d3.mean(knownPages, (book) => book.pages))
      };
    })
    .sort((left, right) => d3.descending(left.average, right.average));

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(rows, (row) => row.average)])
    .nice()
    .range([margin.left, width - margin.right]);
  const y = d3
    .scaleBand()
    .domain(rows.map((row) => row.genre))
    .range([margin.top, height - margin.bottom])
    .padding(0.22);

  const svg = appendSvg(
    element,
    width,
    height,
    'Horizontal bars showing average page count by broad genre for books that count as read.'
  );

  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width < 480 ? 4 : 6))
    .call((axis) => axis.select('.domain').remove());
  svg
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .call((axis) => axis.select('.domain').remove());

  svg
    .append('g')
    .selectAll('rect')
    .data(rows)
    .join('rect')
    .attr('x', x(0))
    .attr('y', (row) => y(row.genre))
    .attr('width', (row) => x(row.average) - x(0))
    .attr('height', y.bandwidth())
    .attr('fill', (row) => colors.get(row.genre))
    .append('title')
    .text(
      (row) =>
        `${row.genre}: ${row.average} average pages; page count known for ${row.known} of ${row.total} books`
    );

  svg
    .append('g')
    .selectAll('text')
    .data(rows)
    .join('text')
    .attr('class', 'value-label')
    .attr('x', (row) => x(row.average) + 7)
    .attr('y', (row) => y(row.genre) + y.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .text((row) => `${row.average} · n=${row.known}/${row.total}`);

  d3.select(element)
    .append('p')
    .attr('class', 'chart-note')
    .text('Only 48 of 99 read books have page counts. Each label shows known-page sample / genre total; averages are descriptive, not complete estimates.');
}

function renderCompletionCadence() {
  const element = document.querySelector('#completion-cadence');
  if (!element) return;

  clear(element);
  const width = widthFor(element);
  const height = width < 480 ? 315 : 275;
  const margin = {
    top: 30,
    right: 12,
    bottom: 22,
    left: width < 480 ? 42 : 52
  };
  const years = d3.range(2020, 2027);
  const months = d3.range(1, 13);
  const counts = d3.rollup(
    books,
    (matches) => matches.length,
    (book) => `${book.year}-${book.month}`
  );
  const cells = years.flatMap((year) =>
    months.map((month) => ({
      year,
      month,
      count: counts.get(`${year}-${month}`) || 0
    }))
  );
  const x = d3
    .scaleBand()
    .domain(months)
    .range([margin.left, width - margin.right])
    .padding(0.05);
  const y = d3
    .scaleBand()
    .domain(years)
    .range([margin.top, height - margin.bottom])
    .padding(0.08);
  const fill = d3
    .scaleSequential()
    .domain([0, d3.max(cells, (cell) => cell.count)])
    .interpolator(d3.interpolateBlues);

  const svg = appendSvg(
    element,
    width,
    height,
    'Grid showing the number of books counted as read in each month from 2020 through June 2026.'
  );

  svg
    .append('g')
    .attr('transform', `translate(0,${margin.top})`)
    .call(
      d3
        .axisTop(x)
        .tickFormat((month) => d3.utcFormat('%b')(new Date(Date.UTC(2024, month - 1, 1))))
        .tickSize(0)
    )
    .call((axis) => axis.select('.domain').remove());
  svg
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .call((axis) => axis.select('.domain').remove());

  const groups = svg
    .append('g')
    .selectAll('g')
    .data(cells)
    .join('g');

  groups
    .append('rect')
    .attr('class', 'month-cell')
    .attr('x', (cell) => x(cell.month))
    .attr('y', (cell) => y(cell.year))
    .attr('width', x.bandwidth())
    .attr('height', y.bandwidth())
    .attr('rx', 3)
    .attr('fill', (cell) => (cell.count ? fill(cell.count) : '#e7e7e7'))
    .append('title')
    .text(
      (cell) =>
        `${d3.utcFormat('%B')(new Date(Date.UTC(2024, cell.month - 1, 1)))} ${cell.year}: ${cell.count} counted as read`
    );

  groups
    .append('text')
    .attr('class', (cell) => (cell.count ? 'value-label' : 'zero-label'))
    .attr('x', (cell) => x(cell.month) + x.bandwidth() / 2)
    .attr('y', (cell) => y(cell.year) + y.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .attr('text-anchor', 'middle')
    .attr('fill', (cell) => (cell.count >= 3 ? '#fff' : null))
    .text((cell) => cell.count || '–');

  d3.select(element)
    .append('p')
    .attr('class', 'chart-note')
    .text('This shows recorded read-date cadence, not daily reading. Among the 97 dateable books, the median gap is 16 days and the longest is 166 days; 56 dates are activity/start proxies rather than explicit finishes.');
}

function render() {
  renderBooksByYear();
  renderAveragePages();
  renderCompletionCadence();
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  let resizeTimer;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(render, 120);
  });
});
