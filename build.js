'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const esbuild = require('esbuild');
const Metalsmith = require('metalsmith');
const layouts = require('@metalsmith/layouts');
const markdown = require('@metalsmith/markdown');
const hljs = require('highlight.js');
const moment = require('moment');

const preview = process.argv.includes('--preview');
const siteDirectory = __dirname;
const sourceDirectory = path.join(siteDirectory, 'src');
const buildDirectory = path.join(siteDirectory, 'build');
const watchIgnoredPaths = ['.git', 'build', 'node_modules', '**/.*.swp'];

function addLegacyD3Compat(d3Module) {
  const category20 = [
    '#1f77b4',
    '#aec7e8',
    '#ff7f0e',
    '#ffbb78',
    '#2ca02c',
    '#98df8a',
    '#d62728',
    '#ff9896',
    '#9467bd',
    '#c5b0d5',
    '#8c564b',
    '#c49c94',
    '#e377c2',
    '#f7b6d2',
    '#7f7f7f',
    '#c7c7c7',
    '#bcbd22',
    '#dbdb8d',
    '#17becf',
    '#9edae5'
  ];

  function nest() {
    let key;
    let rollup;
    const api = {
      key(callback) {
        key = callback;
        return api;
      },
      rollup(callback) {
        rollup = callback;
        return api;
      },
      entries(data) {
        if (!key) {
          return rollup(data);
        }
        return Array.from(
          d3Module.rollup(data, rollup, key),
          ([entryKey, value]) => ({ key: entryKey, value })
        );
      }
    };
    return api;
  }

  return {
    ...d3Module,
    nest,
    schemeCategory20: category20
  };
}

function bundleFiles() {
  return async (files, metalsmith) => {
    const entryFiles = Object.keys(files).filter((filename) =>
      filename.endsWith('.bundle.js')
    );

    await Promise.all(
      entryFiles.map(async (filename) => {
        const sourcePath = path.join(metalsmith.source(), filename);
        delete require.cache[require.resolve(sourcePath)];
        const options = require(sourcePath);
        const result = await esbuild.build({
          ...options,
          bundle: true,
          format: 'iife',
          outfile: 'bundle.js',
          platform: 'browser',
          target: 'es2018',
          write: false
        });

        delete files[filename];
        files[filename.replace(/\.bundle\.js$/, '.js')] = {
          contents: Buffer.from(result.outputFiles[0].contents)
        };
      })
    );
  };
}

function useCurrentD3() {
  const d3Bundle = fs.readFileSync(
    path.join(siteDirectory, 'node_modules', 'd3', 'dist', 'd3.min.js')
  );
  return (files) => {
    for (const filename of [
      'content/traveling_on_a_budget/lib/d3.min.js',
      'content/visualizing_travel_effort/lib/d3.min.js'
    ]) {
      files[filename] = { contents: d3Bundle };
    }
  };
}

function addExcerpts() {
  return (files) => {
    for (const [filename, file] of Object.entries(files)) {
      if (!filename.endsWith('.html') || file.excerpt) {
        continue;
      }
      const dom = new JSDOM(file.contents.toString());
      const firstParagraph = dom.window.document.querySelector('p');
      if (firstParagraph) {
        file.excerpt = firstParagraph.outerHTML;
      }
      dom.window.close();
    }
  };
}

function addCollectionsAndPaths() {
  return (files, metalsmith) => {
    for (const [filename, file] of Object.entries(files)) {
      const parsedPath = path.posix.parse(filename);
      file.path = {
        ...parsedPath,
        dir: parsedPath.dir === '.' ? '' : parsedPath.dir
      };
      file.path.dhref = file.path.dir ? `/${file.path.dir}/` : '/';
      file.path.href =
        file.path.base === 'index.html'
          ? file.path.dhref
          : `${file.path.dhref}${file.path.base}`;
    }

    const content = Object.entries(files)
      .filter(([filename]) => /^content\/.+\/index\.html$/.test(filename))
      .map(([, file]) => file)
      .sort(
        (left, right) =>
          new Date(right.publishDate).getTime() -
          new Date(left.publishDate).getTime()
      );
    const partials = Object.entries(files)
      .filter(([filename]) => /^partials\/.+\.html$/.test(filename))
      .map(([, file]) => file);

    for (const file of content) {
      file.collection = ['content'];
    }
    for (const file of partials) {
      file.collection = ['partials'];
    }
    metalsmith.metadata().collections = { content, partials };
  };
}

function preprocessVisualizations() {
  return async (files) => {
    for (const [filename, file] of Object.entries(files)) {
      file.directory = path.posix.dirname(filename);
      if (file.directory === '.') {
        file.directory = '';
      }
      file.filename = path.posix.basename(filename);
    }

    const contentFiles = Object.entries(files).filter(
      ([filename, file]) =>
        filename.endsWith('.html') &&
        Array.isArray(file.collection) &&
        file.collection.includes('content')
    );

    for (const [, htmlFile] of contentFiles) {
      const preprocessFilename = path.posix.join(
        htmlFile.directory,
        'preprocess.js'
      );
      if (!files[preprocessFilename]) {
        continue;
      }

      const modulePath = path.join(sourceDirectory, preprocessFilename);
      delete require.cache[require.resolve(modulePath)];
      const renderers = require(modulePath);
      const filesInDirectory = new Set(
        Object.keys(files).filter(
          (filename) => path.posix.dirname(filename) === htmlFile.directory
        )
      );

      if (renderers.asyncLoad) {
        await renderers.asyncLoad(htmlFile, filesInDirectory, files);
      }

      const dom = new JSDOM(htmlFile.contents.toString());
      for (const [name, renderer] of Object.entries(renderers)) {
        if (name !== 'asyncLoad') {
          renderer.call(
            dom.window,
            dom.window.document.querySelector.bind(dom.window.document)
          );
        }
      }
      htmlFile.contents = Buffer.from(
        dom.window.document.documentElement.innerHTML,
        'utf8'
      );
      dom.window.close();
    }
  };
}

function createSite() {
  return Metalsmith(siteDirectory)
    .metadata({
      moment,
      site: {
        title: 'Spencer Apple',
        url: 'https://spencerapple.com',
        description: '',
        repo: 'https://github.com/sapple-code/spencerapple.com'
      }
    })
    .source('./src')
    .destination('./build')
    .ignore(watchIgnoredPaths)
    .use(
      markdown({
        engineOptions: {
          highlight(code, language) {
            if (language && hljs.getLanguage(language)) {
              return hljs.highlight(code, { language }).value;
            }
            return hljs.highlightAuto(code).value;
          }
        }
      })
    )
    .use(addExcerpts())
    .use(addCollectionsAndPaths())
    .use(useCurrentD3())
    .use(preprocessVisualizations())
    .use(bundleFiles())
    .use(
      layouts({
        transform: 'pug',
        pattern: '**/*.html',
        extname: '.html'
      })
    );
}

function serveBuild() {
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, 'http://localhost');
    const requestPath = decodeURIComponent(requestUrl.pathname);
    const relativePath = requestPath.endsWith('/')
      ? path.join(requestPath, 'index.html')
      : requestPath;
    let filePath = path.resolve(buildDirectory, `.${relativePath}`);

    if (!filePath.startsWith(`${buildDirectory}${path.sep}`)) {
      response.writeHead(400);
      response.end('Bad request');
      return;
    }

    const directoryIndex = path.join(filePath, 'index.html');
    if (
      !requestPath.endsWith('/') &&
      fs.existsSync(directoryIndex) &&
      fs.statSync(directoryIndex).isFile()
    ) {
      response.writeHead(308, {
        Location: `${requestUrl.pathname}/${requestUrl.search}`
      });
      response.end();
      return;
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      filePath = path.join(buildDirectory, '404.html');
      response.statusCode = 404;
    }

    response.setHeader(
      'Content-Type',
      contentTypes[path.extname(filePath)] || 'application/octet-stream'
    );
    fs.createReadStream(filePath).pipe(response);
  });

  server.listen(Number(process.env.PORT || 8080), () => {
    console.log(`Preview: http://localhost:${server.address().port}`);
  });
}

async function main() {
  global.d3 = addLegacyD3Compat(await import('d3'));
  const site = createSite();

  if (preview) {
    site.watch('.');
    let serving = false;
    site.build((error, files) => {
      if (error) {
        console.error(error);
        return;
      }
      console.log(`Built ${Object.keys(files).length} files`);
      if (!serving) {
        serving = true;
        serveBuild();
      }
    });
    return;
  }

  const files = await site.build();
  console.log(`Built ${Object.keys(files).length} files`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
