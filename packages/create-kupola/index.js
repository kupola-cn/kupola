#!/usr/bin/env node

import prompts from 'prompts';
import kleur from 'kleur';
import { fileURLToPath } from 'node:url';
import { resolve, join, basename } from 'node:path';
import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TEMPLATES = join(__dirname, 'templates');

// ── Helpers ─────────────────────────────────────────

function copyDir(src, dest) {
  cpSync(src, dest, { recursive: true });
}

function replaceInFile(filePath, replacements) {
  let content = readFileSync(filePath, 'utf-8');
  for (const [ from, to ] of replacements) {
    content = content.replaceAll(from, to);
  }
  writeFileSync(filePath, content, 'utf-8');
}

function run(cmd, cwd) {
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

// ── Main ────────────────────────────────────────────

async function main() {
  console.log(kleur.bold().cyan('\n  ⚡ create-kupola') + kleur.gray(' — Scaffold a Kupola project\n'));

  // Parse CLI arguments
  const args = process.argv.slice(2);
  const templateArg = args.find(a => a.startsWith('--template='));
  const nameArg = args.find(a => !a.startsWith('--'));
  const useTS = args.includes('--typescript') || args.includes('--ts');

  // 1. Project name
  let name = nameArg;
  if (!name) {
    const { name: promptedName } = await prompts({
      type: 'text',
      name: 'name',
      message: 'Project name:',
      initial: 'my-kupola-app',
      validate: (v) => /^[a-z0-9-_]+$/i.test(v) || 'Use letters, numbers, hyphens, or underscores only',
    });
    name = promptedName;
  }

  if (!name) {
    console.log(kleur.yellow('\n  Cancelled.\n'));
    process.exit(0);
  }

  const targetDir = resolve(process.cwd(), name);

  if (existsSync(targetDir)) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `Directory "${name}" already exists. Overwrite?`,
      initial: false,
    });
    if (!overwrite) {
      console.log(kleur.yellow('\n  Cancelled.\n'));
      process.exit(0);
    }
  }

  // 2. Backend framework
  let framework;
  if (templateArg) {
    const templateName = templateArg.split('=')[1];
    const validTemplates = ['static', 'static-ts', 'flask', 'fastapi', 'gin'];
    if (!validTemplates.includes(templateName)) {
      console.log(kleur.red(`\n  Invalid template: ${templateName}`));
      console.log(kleur.gray(`  Valid templates: ${validTemplates.join(', ')}`));
      process.exit(1);
    }
    framework = templateName;
  } else if (useTS) {
    framework = 'static-ts';
  } else {
    const { framework: promptedFramework } = await prompts({
      type: 'select',
      name: 'framework',
      message: 'Backend framework:',
      choices: [
        { title: 'Static (HTML only)', value: 'static', description: 'No backend, pure static HTML + Kupola' },
        { title: 'Static + TypeScript', value: 'static-ts', description: 'TypeScript + Vite, type-safe Kupola project' },
        { title: 'Flask', value: 'flask', description: 'Python Flask with Jinja2 templates' },
        { title: 'FastAPI', value: 'fastapi', description: 'Python FastAPI with Jinja2 templates' },
        { title: 'Gin', value: 'gin', description: 'Go Gin with html/template' },
      ],
      initial: 0,
    });
    framework = promptedFramework;
  }

  if (framework === undefined) {
    console.log(kleur.yellow('\n  Cancelled.\n'));
    process.exit(0);
  }

  // 3. Optional features
  let features;
  if (templateArg) {
    // Non-interactive: use defaults
    features = ['dark'];
  } else {
    const { features: promptedFeatures } = await prompts({
      type: 'multiselect',
      name: 'features',
      message: 'Optional features (space to toggle):',
      instructions: false,
      choices: [
        { title: 'Dark theme enabled', value: 'dark', selected: true },
        { title: 'Example pages', value: 'examples', selected: false },
      ],
    });
    features = promptedFeatures;
  }

  if (features === undefined) {
    console.log(kleur.yellow('\n  Cancelled.\n'));
    process.exit(0);
  }

  // ── Scaffold ──────────────────────────────────────

  console.log(kleur.cyan(`\n  Creating project "${name}"...`));

  mkdirSync(targetDir, { recursive: true });

  // Copy template
  const templateDir = join(TEMPLATES, framework);
  copyDir(templateDir, targetDir);

  // Apply options
  const dataAttrs = [];
  if (features.includes('dark')) {dataAttrs.push('data-theme="dark"');}

  // Replace placeholders in all template files (.html, .go, .mod)
  const templateFiles = [];
  function findTemplateFiles(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {findTemplateFiles(full);}
      else if (/\.(html|go|mod|ts|js|json)$/.test(entry.name)) {templateFiles.push(full);}
    }
  }
  findTemplateFiles(targetDir);

  for (const file of templateFiles) {
    replaceInFile(file, [
      [ '{{PROJECT_NAME}}', name ],
      [ 'data-theme="dark"', features.includes('dark') ? 'data-theme="dark"' : 'data-theme="light"' ],
    ]);
  }

  // Remove examples if not selected
  const examplesDir = join(targetDir, 'examples');
  if (!features.includes('examples') && existsSync(examplesDir)) {
    rmSync(examplesDir, { recursive: true });
  }

  // ── Install dependencies ──────────────────────────

  console.log(kleur.cyan('\n  Installing dependencies...'));

  let hasDeps = false;
  if (framework === 'gin') {
    run('npm install', targetDir); // 安装前端 CSS/JS
    hasDeps = run('go mod tidy', targetDir); // 安装 Go 依赖
  } else {
    hasDeps = run('npm install', targetDir);
  }

  // ── Copy Kupola static files (Flask / FastAPI / Gin) ──

  if (framework !== 'static') {
    const kupolaPkg = join(targetDir, 'node_modules', '@kupola', 'kupola');
    const staticDir = join(targetDir, 'static', 'kupola');

    if (existsSync(kupolaPkg)) {
      console.log(kleur.cyan('\n  Copying Kupola assets to static/kupola/...'));
      mkdirSync(staticDir, { recursive: true });

      const distDir = join(kupolaPkg, 'dist');
      if (existsSync(distDir)) {
        cpSync(distDir, staticDir, { recursive: true });
      }
    }
  }

  // ── Done ──────────────────────────────────────────

  const devCmd = {
    static: 'npx vite',
    'static-ts': 'npx vite',
    flask: 'python app.py',
    fastapi: 'uvicorn main:app --reload',
    gin: 'go run main.go',
  }[framework];

  console.log(kleur.green(kleur.bold('\n  ✅ Project created successfully!\n')));
  console.log(kleur.white(`  ${kleur.bold('Next steps:')}\n`));
  console.log(kleur.gray(`    cd ${name}`));

  if (hasDeps) {
    console.log(kleur.gray(`    ${devCmd}`));
  } else if (framework === 'gin') {
    console.log(kleur.gray('    go mod tidy'));
    console.log(kleur.gray(`    ${devCmd}`));
  } else {
    console.log(kleur.gray('    npm install'));
    console.log(kleur.gray(`    ${devCmd}`));
  }

  if (framework === 'flask' || framework === 'fastapi') {
    console.log(kleur.gray('\n  # Install Python dependencies:'));
    console.log(kleur.gray('    pip install -r requirements.txt'));
  }

  console.log(kleur.gray(`\n  ${kleur.bold('Docs:')} https://github.com/kupola-cn/kupola`));
  console.log();
}

main().catch((err) => {
  console.error(kleur.red('\n  Error:'), err.message);
  process.exit(1);
});
