'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const buildDirectory = path.resolve(__dirname, '..', 'build');
const sourceDirectory = path.resolve(__dirname, '..', 'src');

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(filename) : [filename];
  });
}

const posts = listFiles(sourceDirectory)
  .filter((filename) => path.basename(filename) === 'preprocess.js')
  .map((filename) => ({
    path: `/${path.relative(sourceDirectory, path.dirname(filename)).split(path.sep).join('/')}/`
  }));

function fileFor(requestPath) {
  const pathname = decodeURIComponent(new URL(requestPath, 'http://localhost').pathname);
  const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const filename = path.resolve(buildDirectory, `.${relative}`);
  assert(filename.startsWith(`${buildDirectory}${path.sep}`));
  return filename;
}

function startServer() {
  const server = http.createServer((request, response) => {
    const filename = fileFor(request.url);
    if (!fs.existsSync(filename)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    const contentTypes = {
      '.css': 'text/css',
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.json': 'application/json'
    };
    response.setHeader('Content-Type', contentTypes[path.extname(filename)] || 'application/octet-stream');
    fs.createReadStream(filename).pipe(response);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function assertRendered(document, post) {
  for (const id of post.charts) {
    const chart = document.getElementById(id);
    assert(chart, `${post.path} is missing chart container #${id}`);
    assert.equal(
      chart.querySelectorAll('svg').length,
      1,
      `${post.path} should pre-render one SVG in #${id}`
    );
  }
}

async function waitForEnhancement(document, post) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (post.charts.every((id) => document.getElementById(id)?.dataset.d3Enhanced === 'true')) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail(`${post.path} did not progressively enhance every D3 chart`);
}

async function main() {
  for (const post of posts) {
    const html = fs.readFileSync(fileFor(post.path), 'utf8');
    const noJavaScriptDom = new JSDOM(html);
    post.charts = Array.from(
      noJavaScriptDom.window.document.querySelectorAll('[id] > svg'),
      (svg) => svg.parentElement.id
    );
    assert(post.charts.length > 0, `${post.path} does not pre-render any SVG charts`);
    assertRendered(noJavaScriptDom.window.document, post);
    noJavaScriptDom.window.close();
  }

  const server = await startServer();
  const { port } = server.address();

  try {
    for (const post of posts) {
      const scriptErrors = [];
      const virtualConsole = new VirtualConsole();
      virtualConsole.on('jsdomError', (error) => scriptErrors.push(error));
      virtualConsole.on('error', (error) => scriptErrors.push(error));

      const dom = await JSDOM.fromURL(`http://127.0.0.1:${port}${post.path}`, {
        beforeParse(window) {
          window.fetch = (input, init) => fetch(new URL(input, window.location.href), init);
          window.SVGElement.prototype.getBBox = function () {
            return {
              x: 0,
              y: 0,
              width: Number(this.getAttribute('width')) || (this.textContent || '').length * 6,
              height: Number(this.getAttribute('height')) || 12
            };
          };
        },
        pretendToBeVisual: true,
        resources: 'usable',
        runScripts: 'dangerously',
        virtualConsole
      });

      await waitForEnhancement(dom.window.document, post);
      assertRendered(dom.window.document, post);
      assert.deepEqual(scriptErrors, [], `${post.path} produced browser script errors`);
      dom.window.close();
    }
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  console.log(`Verified no-JavaScript SVGs and D3 enhancement for ${posts.length} posts`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
