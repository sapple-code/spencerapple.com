'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const siteDirectory = path.resolve(__dirname, '..');
const triggerFile = path.join(__dirname, 'dev-watch-trigger.tmp');
const timeoutMilliseconds = 15_000;

function removeTriggerFile() {
  fs.rmSync(triggerFile, { force: true });
}

function request(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (response) => {
        response.resume();
        response.on('end', () => resolve(response));
      })
      .on('error', reject);
  });
}

async function verifyPreviewRoute(previewUrl) {
  const route = '/content/visualizing_travel_effort';
  const redirect = await request(`${previewUrl}${route}`);
  assert.equal(redirect.statusCode, 308);
  assert.equal(redirect.headers.location, `${route}/`);

  const page = await request(`${previewUrl}${route}/`);
  assert.equal(page.statusCode, 200);
}

async function verifyDevWatch() {
  removeTriggerFile();

  const child = spawn(process.execPath, ['build.js', '--preview'], {
    cwd: siteDirectory,
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let builds = 0;
  let output = '';
  let verifyingPreview = false;

  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(
            `development watcher did not rebuild within ${timeoutMilliseconds}ms\n${output}`
          )
        );
      }, timeoutMilliseconds);

      function finish(error) {
        clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }

      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        output += text;
        builds += (text.match(/Built \d+ files/g) || []).length;

        if (builds === 1 && !fs.existsSync(triggerFile)) {
          fs.writeFileSync(triggerFile, 'trigger a rebuild\n');
        } else if (builds >= 2 && !verifyingPreview) {
          verifyingPreview = true;
          const previewUrl = output.match(/Preview: (http:\/\/[^\s]+)/)?.[1];
          if (!previewUrl) {
            finish(new Error(`development server URL was not reported\n${output}`));
            return;
          }
          verifyPreviewRoute(previewUrl).then(() => finish(), finish);
        }
      });
      child.stderr.on('data', (chunk) => {
        output += chunk.toString();
      });
      child.on('error', finish);
      child.on('exit', (code, signal) => {
        if (builds < 2) {
          finish(
            new Error(
              `development server exited before rebuilding (${code ?? signal})\n${output}`
            )
          );
        }
      });
    });
  } finally {
    child.kill();
    removeTriggerFile();
  }

  assert.equal(builds, 2);
  console.log('Verified development rebuilds and extensionless preview routes');
}

verifyDevWatch().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
