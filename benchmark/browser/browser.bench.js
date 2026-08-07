// SPDX-License-Identifier: MIT
/**
 * Playwright browser performance benchmark.
 *
 * Usage: node benchmark/browser/browser.bench.js
 *
 * Runs real browser performance tests using Playwright to measure:
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - Signal/Computed/Effect performance (real Kupola core)
 * - Component rendering performance (Table/VirtualList/Form)
 * - Memory usage
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const PORT = 8088;

// Simple HTTP server for ESM module resolution
function startServer() {
  return new Promise((resolve) => {
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
    };

    const server = createServer((req, res) => {
      let filePath = path.join(__dirname, req.url === '/' ? 'test-page.html' : req.url);

      // Allow access to packages directory for ESM imports
      if (req.url.startsWith('/packages/')) {
        filePath = path.join(path.dirname(__dirname), '..', req.url);
      }

      const extname = path.extname(filePath);
      const contentType = mimeTypes[extname] || 'application/octet-stream';

      fs.readFile(filePath, (error, content) => {
        if (error) {
          if (error.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('404 Not Found');
          } else {
            res.writeHead(500);
            res.end('Server Error: ' + error.code);
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });

    server.listen(PORT, () => {
      console.log(`[SERVER] Running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function runBrowserBenchmark() {
  // Start HTTP server
  const server = await startServer();

  const browser = await chromium.launch({
    headless: true,
    args: [ '--no-sandbox', '--disable-setuid-sandbox' ],
  });

  const results = [];

  try {
    // Test 1: Page Load Performance (FCP/LCP)
    console.log('[BROWSER BENCH] Test 1: Page Load Performance');
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      permissions: [ 'clipboard-read' ],
    });

    // Wait for page to fully load with Kupola ESM modules
    await page.goto(`http://localhost:${PORT}/test-page.html`, {
      waitUntil: 'networkidle',
    });

    // Wait for Kupola to be ready
    await page.waitForFunction(() => window.__KUPOLA_BENCHMARK_READY__ === true, { timeout: 10000 });

    // Check if real Kupola was loaded
    const kupolaLoaded = await page.evaluate(() => window.__KUPOLA_LOADED__ === true);
    console.log(`[KUPOLA] Real Kupola loaded: ${kupolaLoaded ? 'Yes' : 'No (using fallback)'}`);

    // Get FCP/LCP
    const loadMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const fcp = entries.find(e => e.entryType === 'paint' && e.name === 'first-contentful-paint');
          const lcp = entries.find(e => e.entryType === 'largest-contentful-paint');

          if (fcp && lcp) {
            observer.disconnect();
            resolve({
              fcp: fcp.startTime,
              lcp: lcp.startTime,
            });
          }
        });

        observer.observe({ type: 'paint', buffered: true });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });

        // Fallback timeout
        setTimeout(() => {
          observer.disconnect();
          resolve({ fcp: 0, lcp: 0 });
        }, 5000);
      });
    });

    results.push({
      test: 'Page FCP (First Contentful Paint)',
      value: loadMetrics.fcp,
      unit: 'ms',
      iterations: 1,
      status: loadMetrics.fcp > 0 ? 'OK' : 'TIMEOUT',
    });

    results.push({
      test: 'Page LCP (Largest Contentful Paint)',
      value: loadMetrics.lcp,
      unit: 'ms',
      iterations: 1,
      status: loadMetrics.lcp > 0 ? 'OK' : 'TIMEOUT',
    });

    // Test 2: Run all tests via window.runAllTests
    console.log('[BROWSER BENCH] Test 2: Running all Kupola tests');
    const allResults = await page.evaluate(async () => {
      try {
        console.log('runAllTests exists:', typeof window.runAllTests);
        const result = await window.runAllTests();
        console.log('runAllTests result:', result);
        return result;
      } catch (err) {
        console.error('Test error:', err.message, err.stack);
        return { error: err.message };
      }
    });

    console.log(`[BROWSER BENCH] All tests results: ${allResults ? (allResults.error ? 'ERROR: ' + allResults.error : 'OK') : 'FAILED'}`);

    if (allResults && allResults.signal) {
      // Add signal results
      allResults.signal.forEach(r => {
        results.push({
          test: r.name,
          value: r.time,
          unit: 'ms',
          iterations: 1,
          status: 'OK',
        });
      });
    }

    if (allResults && allResults.render) {
      // Add render results
      allResults.render.forEach(r => {
        results.push({
          test: r.name,
          value: r.time,
          unit: 'ms',
          iterations: 1,
          status: 'OK',
        });
      });
    }

    // Test 3: INP (Interaction to Next Paint) - using Playwright's click
    console.log('[BROWSER BENCH] Test 3: INP (Interaction to Next Paint)');
    const inpValue = await page.evaluate(() => {
      return new Promise((resolve) => {
        let maxInp = 0;
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            if (entry.interactionId && entry.duration > maxInp) {
              maxInp = entry.duration;
            }
          });
        });

        observer.observe({ type: 'event', buffered: true });

        // Simulate user interactions using Playwright will trigger this
        setTimeout(() => {
          observer.disconnect();
          resolve(maxInp);
        }, 1000);
      });
    });

    // Trigger a real click
    await page.click('#run-all-tests');

    results.push({
      test: 'INP (Interaction to Next Paint)',
      value: inpValue,
      unit: 'ms',
      iterations: 1,
      status: inpValue < 200 ? 'OK' : 'SLOW',
    });

    // Test 4: Memory Usage
    console.log('[BROWSER BENCH] Test 4: Memory Usage');
    const memoryUsage = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
          totalJSHeapSize: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
          jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
        };
      }
      return null;
    });

    if (memoryUsage) {
      results.push({
        test: 'Memory Used JS Heap',
        value: parseFloat(memoryUsage.usedJSHeapSize),
        unit: 'MB',
        iterations: 1,
        status: 'OK',
      });

      results.push({
        test: 'Memory Total JS Heap',
        value: parseFloat(memoryUsage.totalJSHeapSize),
        unit: 'MB',
        iterations: 1,
        status: 'OK',
      });
    }

    await page.close();
  } finally {
    await browser.close();
    server.close();
  }

  // Save results
  const outputPath = path.join(__dirname, 'browser-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n[BROWSER BENCH] Results saved to ${outputPath}`);

  // Print summary
  console.log('\n=== Browser Benchmark Results ===');
  results.forEach(r => {
    const statusIcon = r.status === 'OK' ? '✅' : '⚠️';
    console.log(`${statusIcon} ${r.test}: ${r.value.toFixed(2)}${r.unit}`);
  });

  return results;
}

// Run if called directly
const isMain = process.argv[1] && process.argv[1].endsWith('browser.bench.js');
if (isMain) {
  runBrowserBenchmark().catch(console.error);
}

export default runBrowserBenchmark;
