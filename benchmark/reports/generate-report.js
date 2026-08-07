// SPDX-License-Identifier: MIT
/**
 * HTML report generator for benchmark results.
 *
 * Usage: node benchmark/reports/generate-report.js
 *
 * Reads JSON results and generates a human-readable HTML report.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = __dirname;
const coreResults = JSON.parse(fs.readFileSync(path.join(reportsDir, 'core-results.json'), 'utf8'));
const componentsResults = JSON.parse(fs.readFileSync(path.join(reportsDir, 'components-results.json'), 'utf8'));

const allResults = [ ...coreResults, ...componentsResults ];

const categories = {
  core: {
    name: 'Core Engine',
    color: '#3B82F6',
    tests: coreResults,
  },
  components: {
    name: 'Components',
    color: '#10B981',
    tests: componentsResults,
  },
};

function formatTime(ms) {
  if (ms < 1) {return `${(ms * 1000).toFixed(2)}μs`;}
  if (ms < 1000) {return `${ms.toFixed(2)}ms`;}
  return `${(ms / 1000).toFixed(2)}s`;
}

function generateChart(tests, color) {
  const maxTime = Math.max(...tests.map(t => t.avgTime));

  return tests.map((test, _index) => `
    <div class="chart-bar-container">
      <div class="chart-label">${test.test}</div>
      <div class="chart-bar-wrapper">
        <div 
          class="chart-bar" 
          style="width: ${(test.avgTime / maxTime) * 100}%; background: ${color};"
          title="${formatTime(test.avgTime)}"
        ></div>
        <div class="chart-value">${formatTime(test.avgTime)}</div>
      </div>
    </div>
  `).join('');
}

function generateSummary(tests) {
  const total = tests.length;
  const passed = tests.filter(t => t.avgTime < 500).length;
  const avgTime = tests.reduce((sum, t) => sum + t.avgTime, 0) / total;
  const minTime = Math.min(...tests.map(t => t.avgTime));
  const maxTime = Math.max(...tests.map(t => t.avgTime));

  return `
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-value">${total}</div>
        <div class="summary-label">Total Tests</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${passed}/${total}</div>
        <div class="summary-label">Passed</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${formatTime(avgTime)}</div>
        <div class="summary-label">Avg Time</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${formatTime(minTime)}</div>
        <div class="summary-label">Fastest</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${formatTime(maxTime)}</div>
        <div class="summary-label">Slowest</div>
      </div>
    </div>
  `;
}

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kupola Benchmark Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #f1f5f9; }
    .subtitle { color: #94a3b8; margin-bottom: 2rem; }
    .timestamp { color: #64748b; font-size: 0.875rem; margin-bottom: 2rem; }
    
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .summary-item { background: #1e293b; padding: 1rem; border-radius: 0.5rem; text-align: center; }
    .summary-value { font-size: 1.5rem; font-weight: bold; color: #f1f5f9; }
    .summary-label { font-size: 0.875rem; color: #94a3b8; margin-top: 0.25rem; }
    
    .section { background: #1e293b; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; }
    .section-title { font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .section-title::before { content: ''; width: 4px; height: 1.25rem; border-radius: 2px; }
    
    .chart-bar-container { margin-bottom: 0.75rem; }
    .chart-label { font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem; }
    .chart-bar-wrapper { display: flex; align-items: center; gap: 0.75rem; height: 24px; }
    .chart-bar { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
    .chart-value { font-size: 0.875rem; color: #f1f5f9; font-weight: 500; min-width: 60px; text-align: right; }
    
    .table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .table th, .table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #334155; }
    .table th { color: #94a3b8; font-weight: 500; font-size: 0.875rem; }
    .table td { color: #f1f5f9; }
    .table tr:hover { background: #334155; }
    
    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .badge-fast { background: #065f46; color: #a7f3d0; }
    .badge-normal { background: #7c2d12; color: #fed7aa; }
    .badge-slow { background: #7f1d1d; color: #fca5a5; }
    
    @media (max-width: 640px) {
      body { padding: 1rem; }
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
      .chart-bar-wrapper { flex-direction: column; align-items: flex-start; height: auto; }
      .chart-value { min-width: auto; text-align: left; margin-top: 0.25rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Kupola Performance Benchmark</h1>
    <div class="subtitle">${allResults.length} tests completed</div>
    <div class="timestamp">Generated at ${new Date().toLocaleString('zh-CN')}</div>
    
    ${generateSummary(allResults)}
    
    ${Object.entries(categories).map(([ _key, cat ]) => `
      <div class="section">
        <div class="section-title" style="--color: ${cat.color}">
          <span style="background: ${cat.color}; width: 4px; height: 1.25rem; border-radius: 2px; display: inline-block; margin-right: 0.5rem;"></span>
          ${cat.name}
        </div>
        
        ${generateChart(cat.tests, cat.color)}
        
        <table class="table">
          <thead>
            <tr>
              <th>Test</th>
              <th>Iterations</th>
              <th>Avg Time</th>
              <th>Total Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${cat.tests.map(test => {
    let badgeClass = 'badge-fast';
    if (test.avgTime >= 100 && test.avgTime < 500) {badgeClass = 'badge-normal';}
    if (test.avgTime >= 500) {badgeClass = 'badge-slow';}

    return `
                <tr>
                  <td>${test.test}</td>
                  <td>${test.iterations}</td>
                  <td>${formatTime(test.avgTime)}</td>
                  <td>${formatTime(test.totalTime)}</td>
                  <td><span class="badge ${badgeClass}">${test.avgTime < 500 ? 'OK' : 'SLOW'}</span></td>
                </tr>
              `;
  }).join('')}
          </tbody>
        </table>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(reportsDir, 'benchmark-report.html'), html);
console.log(`[REPORT] HTML report generated: ${path.join(reportsDir, 'benchmark-report.html')}`);
