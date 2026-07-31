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

const datedBooksWithPages = books.filter((book) => book.pages);
const seriesNames = Array.from(
  d3.group(
    datedBooksWithPages.filter((book) => book.series),
    (book) => book.series
  ).keys()
).sort(d3.ascending);
let selectedSeries = 'All books';

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
    .text('All 99 read books now have page counts: 48 came from the sheet, 50 were matched to the recorded Kindle ASIN, and Good to Great uses the original hardcover edition. Page counts vary by edition.');
}

function renderBookScatter() {
  const element = document.querySelector('#books-page-scatter');
  if (!element) return;

  clear(element);
  appendLegend(element);

  const controls = d3.select(element).append('div').attr('class', 'chart-controls');
  controls
    .append('label')
    .attr('for', 'series-highlight')
    .text('Highlight a series');
  const select = controls
    .append('select')
    .attr('id', 'series-highlight')
    .attr('class', 'series-select')
    .on('change', (event) => {
      selectedSeries = event.target.value;
      updateHighlight();
    });
  select
    .selectAll('option')
    .data(['All books', ...seriesNames])
    .join('option')
    .attr('value', (name) => name)
    .property('selected', (name) => name === selectedSeries)
    .text((name) => name);

  const width = widthFor(element);
  const height = width < 480 ? 350 : 430;
  const margin = { top: 18, right: 18, bottom: 46, left: 54 };
  const x = d3
    .scaleUtc()
    .domain([
      d3.utcYear.floor(d3.min(datedBooksWithPages, (book) => book.readDateValue)),
      d3.max(datedBooksWithPages, (book) => book.readDateValue)
    ])
    .range([margin.left, width - margin.right]);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(datedBooksWithPages, (book) => book.pages)])
    .nice()
    .range([height - margin.bottom, margin.top]);
  const svg = appendSvg(
    element,
    width,
    height,
    'Scatterplot of 97 dateable books by read date and page count, colored by broad genre. A series selector highlights related books.'
  );

  svg
    .append('g')
    .attr('class', 'chart-grid')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(''))
    .call((axis) => axis.select('.domain').remove());
  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width < 480 ? 4 : d3.utcYear.every(1)).tickFormat(d3.utcFormat('%Y')))
    .call((axis) => axis.select('.domain').remove());
  svg
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6))
    .call((axis) => axis.select('.domain').remove());
  svg
    .append('text')
    .attr('class', 'axis-label')
    .attr('x', margin.left)
    .attr('y', 11)
    .text('Pages');

  const dots = svg
    .append('g')
    .selectAll('circle')
    .data(datedBooksWithPages)
    .join('circle')
    .attr('class', 'book-dot')
    .attr('cx', (book) => x(book.readDateValue))
    .attr('cy', (book) => y(book.pages))
    .attr('fill', (book) => colors.get(book.genre))
    .attr('r', 4.5);
  dots
    .append('title')
    .text(
      (book) =>
        `${book.title}\n${d3.utcFormat('%B %-d, %Y')(book.readDateValue)} · ${book.pages} pages · ${book.genre}${book.series ? ` · ${book.series}` : ''}`
    );

  const detail = d3
    .select(element)
    .append('div')
    .attr('class', 'series-detail')
    .attr('aria-live', 'polite');

  function updateHighlight() {
    const allSelected = selectedSeries === 'All books';
    dots
      .classed('is-muted', (book) => !allSelected && book.series !== selectedSeries)
      .classed('is-highlighted', (book) => !allSelected && book.series === selectedSeries)
      .attr('r', (book) => (!allSelected && book.series === selectedSeries ? 7 : 4.5));

    if (allSelected) {
      detail.html(
        '<strong>All dateable books</strong><span>97 dots · 45,464 pages · 2020–2026. Choose a series to isolate its run and list its books.</span>'
      );
      return;
    }

    const matches = datedBooksWithPages.filter(
      (book) => book.series === selectedSeries
    );
    const extent = d3.extent(matches, (book) => book.readDateValue);
    const average = Math.round(d3.mean(matches, (book) => book.pages));
    const titleList = matches.map((book) => book.title).join(' · ');
    detail.html('');
    detail.append('strong').text(selectedSeries);
    detail
      .append('span')
      .text(
        `${matches.length} books · ${average} average pages · ${d3.utcFormat('%b %Y')(extent[0])}–${d3.utcFormat('%b %Y')(extent[1])}`
      );
    detail.append('p').text(titleList);
  }

  updateHighlight();
  d3.select(element)
    .append('p')
    .attr('class', 'chart-note')
    .text('Each dot is one book that counts as read. Two manually completed books have no usable date and are omitted: The Hard Thing About Hard Things and Good to Great. Page count is edition-dependent.');
}

function renderPagesVsFlips() {
  const element = document.querySelector('#pages-vs-page-flips');
  if (!element) return;

  clear(element);
  appendLegend(element);
  const matches = readingHistory.filter((book) => book.pages && book.pageFlips);
  const pageMean = d3.mean(matches, (book) => book.pages);
  const flipMean = d3.mean(matches, (book) => book.pageFlips);
  const covariance = d3.sum(
    matches,
    (book) => (book.pages - pageMean) * (book.pageFlips - flipMean)
  );
  const pageVariance = d3.sum(
    matches,
    (book) => (book.pages - pageMean) ** 2
  );
  const flipVariance = d3.sum(
    matches,
    (book) => (book.pageFlips - flipMean) ** 2
  );
  const slope = covariance / pageVariance;
  const intercept = flipMean - slope * pageMean;
  const correlation = covariance / Math.sqrt(pageVariance * flipVariance);
  const flipsPerPage =
    d3.sum(matches, (book) => book.pageFlips) /
    d3.sum(matches, (book) => book.pages);

  const width = widthFor(element);
  const height = width < 480 ? 350 : 430;
  const margin = { top: 18, right: 18, bottom: 50, left: 62 };
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(matches, (book) => book.pages)])
    .nice()
    .range([margin.left, width - margin.right]);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(matches, (book) => book.pageFlips)])
    .nice()
    .range([height - margin.bottom, margin.top]);
  const svg = appendSvg(
    element,
    width,
    height,
    'Scatterplot comparing edition page count with Kindle page flips for 91 books, colored by genre.'
  );

  svg
    .append('g')
    .attr('class', 'chart-grid')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(''))
    .call((axis) => axis.select('.domain').remove());
  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width < 480 ? 4 : 6))
    .call((axis) => axis.select('.domain').remove());
  svg
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format('~s')))
    .call((axis) => axis.select('.domain').remove());
  svg
    .append('text')
    .attr('class', 'axis-label')
    .attr('x', margin.left)
    .attr('y', 11)
    .text('Kindle page flips');
  svg
    .append('text')
    .attr('class', 'axis-label')
    .attr('text-anchor', 'end')
    .attr('x', width - margin.right)
    .attr('y', height - 8)
    .text('Edition page count');

  const lineStart = Math.max(0, -intercept / slope);
  const lineEnd = x.domain()[1];
  svg
    .append('line')
    .attr('class', 'comparison-trend')
    .attr('x1', x(lineStart))
    .attr('y1', y(intercept + slope * lineStart))
    .attr('x2', x(lineEnd))
    .attr('y2', y(intercept + slope * lineEnd));
  svg
    .append('g')
    .selectAll('circle')
    .data(matches)
    .join('circle')
    .attr('class', 'book-dot')
    .attr('cx', (book) => x(book.pages))
    .attr('cy', (book) => y(book.pageFlips))
    .attr('fill', (book) => colors.get(book.genre))
    .attr('r', 4.5)
    .append('title')
    .text(
      (book) =>
        `${book.title}\n${book.pages} pages · ${book.pageFlips.toLocaleString()} page flips · ${(book.pageFlips / book.pages).toFixed(2)} flips/page`
    );

  d3.select(element)
    .append('p')
    .attr('class', 'series-detail comparison-summary')
    .html(
      `<strong>Strong relationship: r=${correlation.toFixed(2)}</strong><span>${flipsPerPage.toFixed(2)} Kindle page flips per edition page overall · n=${matches.length}</span>`
    );
  d3.select(element)
    .append('p')
    .attr('class', 'chart-note')
    .text('The dashed line is an ordinary least-squares trend, not a conversion rule. Page flips are Kindle interaction events and can include navigation or revisiting; eight read books have no flip count.');
}

function renderDailyPages() {
  const element = document.querySelector('#pages-per-day');
  if (!element) return;

  clear(element);
  const flipBooks = readingHistory.filter((book) => book.pages && book.pageFlips);
  const pagesPerFlip =
    d3.sum(flipBooks, (book) => book.pages) /
    d3.sum(flipBooks, (book) => book.pageFlips);
  const paceBooks = readingHistory
    .filter((book) => book.startDate && book.readDate && book.pages)
    .map((book) => {
      const start = d3.utcParse('%Y-%m-%d')(book.startDate);
      const recordedEnd = d3.utcParse('%Y-%m-%d')(book.readDate);
      return { ...book, start, end: recordedEnd < start ? start : recordedEnd };
    });
  const firstDate = d3.min(paceBooks, (book) => book.start);
  const lastDate = d3.max(paceBooks, (book) => book.end);
  const daily = d3.utcDays(firstDate, d3.utcDay.offset(lastDate, 1)).map((date) => {
    const activeBooks = paceBooks.filter(
      (book) => date >= book.start && date <= book.end
    );
    return {
      date,
      pages: d3.sum(activeBooks, (book) => {
        const activeDays = d3.utcDay.count(book.start, book.end) + 1;
        return book.pages / activeDays;
      }),
      flipEquivalent: d3.sum(
        activeBooks.filter((book) => book.pageFlips),
        (book) => {
          const activeDays = d3.utcDay.count(book.start, book.end) + 1;
          return (book.pageFlips * pagesPerFlip) / activeDays;
        }
      )
    };
  });
  daily.forEach((day, index) => {
    const window = daily.slice(Math.max(0, index - 29), index + 1);
    day.average = d3.mean(window, (entry) => entry.pages);
    day.flipAverage = d3.mean(window, (entry) => entry.flipEquivalent);
  });

  const lineLegend = d3.select(element).append('ul').attr('class', 'legend line-legend');
  const lineItems = lineLegend
    .selectAll('li')
    .data([
      { label: 'Edition-page estimate', className: 'page-line-swatch' },
      { label: 'Flip-derived page equivalent', className: 'flip-line-swatch' }
    ])
    .join('li');
  lineItems.append('span').attr('class', (item) => `line-swatch ${item.className}`);
  lineItems.append('span').text((item) => item.label);

  const width = widthFor(element);
  const height = width < 480 ? 330 : 390;
  const margin = { top: 18, right: 18, bottom: 46, left: 54 };
  const x = d3
    .scaleUtc()
    .domain([firstDate, lastDate])
    .range([margin.left, width - margin.right]);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(daily, (day) => Math.max(day.average, day.flipAverage))])
    .nice()
    .range([height - margin.bottom, margin.top]);
  const svg = appendSvg(
    element,
    width,
    height,
    'Two continuous lines comparing 30-day rolling averages of edition-page estimates and flip-derived page equivalents from May 2020 through June 2026.'
  );

  svg
    .append('g')
    .attr('class', 'chart-grid')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(''))
    .call((axis) => axis.select('.domain').remove());
  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width < 480 ? 4 : d3.utcYear.every(1)).tickFormat(d3.utcFormat('%Y')))
    .call((axis) => axis.select('.domain').remove());
  svg
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6))
    .call((axis) => axis.select('.domain').remove());
  svg
    .append('text')
    .attr('class', 'axis-label')
    .attr('x', margin.left)
    .attr('y', 11)
    .text('Page equivalents/day');

  const line = d3
    .line()
    .x((day) => x(day.date))
    .y((day) => y(day.average))
    .curve(d3.curveMonotoneX);
  svg
    .append('path')
    .datum(daily)
    .attr('class', 'pace-line')
    .attr('d', line);
  const flipLine = d3
    .line()
    .x((day) => x(day.date))
    .y((day) => y(day.flipAverage))
    .curve(d3.curveMonotoneX);
  svg
    .append('path')
    .datum(daily)
    .attr('class', 'flip-pace-line')
    .attr('d', flipLine);

  const overall = d3.mean(daily, (day) => day.pages);
  const flipOverall = d3.mean(daily, (day) => day.flipEquivalent);
  d3.select(element)
    .append('p')
    .attr('class', 'series-detail pace-summary')
    .html(`<strong>${overall.toFixed(1)} page estimate vs. ${flipOverall.toFixed(1)} flip-derived equivalents/day</strong><span>30-day rolling averages shown above</span>`);
  d3.select(element)
    .append('p')
    .attr('class', 'chart-note')
    .text(`Estimate, not observed daily activity: each book’s pages or flips are spread evenly across its inclusive Started Reading → chart-date interval, overlapping books are added, and zero-reading gaps stay in the timeline. The flip line converts at ${(1 / pagesPerFlip).toFixed(2)} flips per page, calibrated across 91 books; it covers 90 timed books versus 96 for the page-count line. One reversed source interval is treated as a same-day read.`);
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
  renderBookScatter();
  renderPagesVsFlips();
  renderDailyPages();
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
