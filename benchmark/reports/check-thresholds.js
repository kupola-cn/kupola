// SPDX-License-Identifier: MIT
/**
 * Performance threshold checker for benchmark results.
 *
 * Usage: node benchmark/reports/check-thresholds.js
 *
 * Checks if any benchmark exceeds predefined thresholds and exits with non-zero
 * if thresholds are violated, causing CI to fail.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = __dirname;

// Performance thresholds (in milliseconds)
const thresholds = {
  // Core Engine
  'create 10,000 signals': 10,
  'update signal 100,000 times': 1,
  'batch update 10,000 signals': 10,
  'signal nested reads 100,000 times': 1,
  'create 1,000 computed': 5,
  '3-level computed chain update 10,000 times': 1,
  '100 computed sharing signal update': 1,
  'computed with array filter/map/reduce': 1,
  'create 1,000 effects': 5,
  'effect reaction latency 10,000 times': 1,
  'effect cleanup 1,000 times': 1,

  // Components
  'VirtualList 100 items': 50,
  'VirtualList 1,000 items': 100,
  'VirtualList 10,000 items': 200,
  'VirtualList add/remove 100 times': 50,
  'Table 100×10': 200,
  'Table 1,000×5': 500,
  'Table sorting 100 times': 200,
  'Table pagination 5,000 rows': 500,
  'Form 50 fields': 300,
  'Modal open/close 100 times': 100,
  'Tooltip creation 100 times': 50,
  'SSR renderToString 100 items': 100,
  'SSR renderToString 1,000 items': 500,
};

function checkResults(results, category) {
  let passed = true;
  const failures = [];

  results.forEach(test => {
    const threshold = thresholds[test.test];
    if (threshold !== undefined && test.avgTime > threshold) {
      passed = false;
      failures.push({
        test: test.test,
        avgTime: test.avgTime,
        threshold: threshold,
        percentageOver: ((test.avgTime - threshold) / threshold * 100).toFixed(1),
      });
    }
  });

  if (failures.length > 0) {
    console.log(`\n❌ ${category} Performance Threshold Exceeded:`);
    failures.forEach(f => {
      console.log(`  - ${f.test}: ${f.avgTime.toFixed(2)}ms > ${f.threshold}ms (${f.percentageOver}% over)`);
    });
  }

  return { passed, failures };
}

try {
  const coreResults = JSON.parse(fs.readFileSync(path.join(reportsDir, 'core-results.json'), 'utf8'));
  const componentsResults = JSON.parse(fs.readFileSync(path.join(reportsDir, 'components-results.json'), 'utf8'));

  console.log('🔍 Checking performance thresholds...');

  const coreResult = checkResults(coreResults, 'Core Engine');
  const componentsResult = checkResults(componentsResults, 'Components');

  const allPassed = coreResult.passed && componentsResult.passed;

  if (allPassed) {
    console.log('\n✅ All performance thresholds passed!');
    process.exit(0);
  } else {
    const totalFailures = coreResult.failures.length + componentsResult.failures.length;
    console.log(`\n❌ ${totalFailures} performance threshold(s) exceeded. CI will fail.`);
    console.log('\nTo fix this, optimize the failing tests or adjust thresholds in check-thresholds.js');
    process.exit(1);
  }
} catch (error) {
  console.error('Error checking thresholds:', error.message);
  process.exit(1);
}
