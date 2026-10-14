// karma.conf.js - Auto-detecta Chrome de Puppeteer para que npm test funcione sin dependencias de sistema
const fs = require('fs');
const path = require('path');

// Busca el Chrome de Puppeteer en el cache local
// Estructura típica: ~/.cache/puppeteer/chrome/linux-<version>/chrome-linux64/chrome
// o ~/.cache/puppeteer/chrome-headless-shell/linux-<version>/...
const puppeteerCache = path.join(process.env.HOME || process.env.USERPROFILE, '.cache', 'puppeteer');
let chromeBinary = null;

function findChromeInDir(dir) {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      // Buscar chrome-linux64/chrome dentro
      const chromePath = path.join(fullPath, 'chrome-linux64', 'chrome');
      if (fs.existsSync(chromePath)) return chromePath;
      // Recursivo por si hay más niveles
      const found = findChromeInDir(fullPath);
      if (found) return found;
    }
  }
  return null;
}

if (fs.existsSync(puppeteerCache)) {
  chromeBinary = findChromeInDir(puppeteerCache);
}

// Fallback: si no hay Puppeteer cache, usa 'chrome' del PATH (funciona en CI con Chrome instalado)
if (!chromeBinary) chromeBinary = 'chrome';

process.env.CHROME_BIN = chromeBinary;
console.log('[Karma] Usando Chrome:', chromeBinary);

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    client: { jasmine: {}, clearContext: false },
    jasmineHtmlReporter: { suppressAll: true },
    coverageReporter: {
      dir: path.join(__dirname, './coverage/cafe-frontend'),
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        // Flags para headless en CI y local sin problemas de sandbox
        flags: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      },
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    singleRun: true,
    browserNoActivityTimeout: 60000,
  });
};