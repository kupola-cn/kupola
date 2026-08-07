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
  'batch update 10,000 signals': 15,
  'signal nested reads 100,000 times': 1,
  'create 1,000 computed': 5,
  '3-level computed chain update 10,000 times': 1,
  '100 computed sharing signal update': 1,
  'computed with array filter/map/reduce': 2,
  'create 1,000 effects': 5,
  'effect reaction latency 10,000 times': 1,
  'effect cleanup 1,000 times': 1,

  // Components
  'VirtualList 100 items': 80,
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

// Baseline drift reporting. Absolute thresholds below remain the only hard
// gate: CI runners vary by 2-3x, so a baseline comparison must be
// informational (printed for visibility) rather than a pass/fail gate.
const REGRESSION_SIGNIFICANT_FACTOR = 2.0;
const REGRESSION_WARN_FACTOR = 1.5;
const REGRESSION_INFO_FACTOR = 0.75;
const BASELINE_FILE = path.join(__dirname, 'baseline.json');

function loadBaseline() {
  try {
    return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function writeBaseline(results) {
  const baseline = {
    updatedAt: new Date().toISOString(),
    runner: process.env.RUNNER_OS ? `github-${process.env.RUNNER_OS}` : 'local',
    core: {},
    components: {},
  };
  for (const test of results.core) {
    baseline.core[test.test] = test.avgTime;
  }
  for (const test of results.components) {
    baseline.components[test.test] = test.avgTime;
  }
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2) + '\n');
  return baseline;
}

function checkAgainstBaseline(test, baseline, category) {
  const base = baseline?.[category]?.[test.test];
  if (base === undefined || base <= 0) {return null;}
  const ratio = test.avgTime / base;
  if (ratio >= REGRESSION_SIGNIFICANT_FACTOR) {
    return {
      level: 'warn',
      message: `${test.test}: ${test.avgTime.toFixed(2)}ms is `
        + `${(ratio * 100 - 100).toFixed(0)}% over baseline ${base.toFixed(2)}ms`,
    };
  }
  if (ratio >= REGRESSION_WARN_FACTOR) {
    return {
      level: 'warn',
      message: `${test.test}: ${test.avgTime.toFixed(2)}ms is `
        + `${(ratio * 100 - 100).toFixed(0)}% over baseline ${base.toFixed(2)}ms`,
    };
  }
  if (ratio <= REGRESSION_INFO_FACTOR) {
    return {
      level: 'info',
      message: `${test.test}: improved ${(100 - ratio * 100).toFixed(0)}% `
        + `vs baseline ${base.toFixed(2)}ms`,
    };
  }
  return null;
}

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
  const updateBaseline = process.argv.includes('--update');

  console.log('🔍 Checking performance thresholds...');

  const coreResult = checkResults(coreResults, 'Core Engine');
  const componentsResult = checkResults(componentsResults, 'Components');

  let baseline = loadBaseline();
  if (updateBaseline) {
    baseline = writeBaseline({ core: coreResults, components: componentsResults });
    console.log('📝 Baseline updated in baseline.json');
  }

  const regressionReports = [];
  const scan = (results, category) => {
    for (const test of results) {
      const report = checkAgainstBaseline(test, baseline, category);
      if (report) {regressionReports.push(report);}
    }
  };
  scan(coreResults, 'core');
  scan(componentsResults, 'components');

  const warnings = regressionReports.filter(r => r.level === 'warn');
  const improvements = regressionReports.filter(r => r.level === 'info');

  if (warnings.length > 0) {
    console.log('\n⚠️ Above baseline (informational, not failing):');
    warnings.forEach(w => console.log(`  - ${w.message}`));
  }
  if (improvements.length > 0) {
    console.log('\n✅ Improved vs baseline:');
    improvements.forEach(i => console.log(`  - ${i.message}`));
  }

  const allPassed = coreResult.passed && componentsResult.passed;

  if (allPassed) {
    console.log('\n✅ All performance thresholds passed!');
    process.exit(0);
  } else {
    const totalFailures = coreResult.failures.length + componentsResult.failures.length;
    console.log(`\n❌ ${totalFailures} performance threshold(s) exceeded. CI will fail.`);
    console.log('\nTo fix this, optimize the failing tests, adjust thresholds in check-thresholds.js,');
    console.log('or refresh the baseline with: node benchmark/reports/check-thresholds.js --update');
    process.exit(1);
  }
} catch (error) {
  console.error('Error checking thresholds:', error.message);
  process.exit(1);
}
