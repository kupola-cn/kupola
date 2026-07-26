#!/usr/bin/env node

import prompts from 'prompts';
import kleur from 'kleur';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TEMPLATES = join(__dirname, 'templates');
const VERSION = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8')).version;
const VALID_TEMPLATES = [ 'static', 'static-ts', 'flask', 'fastapi', 'gin', 'nextjs', 'nuxt' ];

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

function isValidProjectName(name) {
  return typeof name === 'string' && /^[a-z0-9-_]+$/i.test(name);
}

function printHelp() {
  console.log(`
Usage: create-kupola [project-name] [options]

Options:
  -t, --template <name>  Template: ${VALID_TEMPLATES.join(', ')}
  -T, --typescript       Use the static TypeScript template
  -f, --force            Replace an existing target directory
      --no-install        Skip dependency installation
  -v, --version          Print the CLI version
  -h, --help             Show this help message
`);
}

function parseArgs(args) {
  const options = {
    name: null,
    template: null,
    useTypeScript: false,
    force: false,
    skipInstall: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--template' || arg === '-t') {
      options.template = args[index + 1];
      index += 1;
    } else if (arg.startsWith('--template=')) {
      options.template = arg.slice('--template='.length);
    } else if (arg === '--typescript' || arg === '--ts' || arg === '-T') {
      options.useTypeScript = true;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--no-install') {
      options.skipInstall = true;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (options.name) {
      throw new Error('Only one project name may be provided.');
    } else {
      options.name = arg;
    }
  }

  if (options.template !== null && !VALID_TEMPLATES.includes(options.template)) {
    throw new Error(`Invalid template: ${options.template}. Valid templates: ${VALID_TEMPLATES.join(', ')}`);
  }
  return options;
}

// ── Main ────────────────────────────────────────────

async function main() {
  console.log(kleur.bold().cyan('\n  ⚡ create-kupola') + kleur.gray(' — Scaffold a Kupola project\n'));

  // Parse CLI arguments
  const args = process.argv.slice(2);
  const {
    name: nameArg,
    template: templateArg,
    useTypeScript: useTS,
    force,
    skipInstall,
  } = parseArgs(args);

  // 1. Project name
  let name = nameArg?.trim();
  if (!name) {
    const { name: promptedName } = await prompts({
      type: 'text',
      name: 'name',
      message: 'Project name:',
      initial: 'my-kupola-app',
      validate: (v) => isValidProjectName(v) || 'Use letters, numbers, hyphens, or underscores only',
    });
    name = promptedName;
  }

  if (!name) {
    console.log(kleur.yellow('\n  Cancelled.\n'));
    process.exit(0);
  }

  if (!isValidProjectName(name)) {
    throw new Error('Project name may contain only letters, numbers, hyphens, and underscores.');
  }

  const targetDir = resolve(process.cwd(), name);

  if (existsSync(targetDir)) {
    const { overwrite } = force
      ? { overwrite: true }
      : await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `Directory "${name}" already exists. Overwrite?`,
        initial: false,
      });
    if (!overwrite) {
      console.log(kleur.yellow('\n  Cancelled.\n'));
      return;
    }
    rmSync(targetDir, { recursive: true, force: true });
  }

  // 2. Backend framework
  let framework;
  if (templateArg) {
    const templateName = templateArg;
    if (!VALID_TEMPLATES.includes(templateName)) {
      console.log(kleur.red(`\n  Invalid template: ${templateName}`));
      console.log(kleur.gray(`  Valid templates: ${VALID_TEMPLATES.join(', ')}`));
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
        { title: 'Next.js (SSR)', value: 'nextjs', description: 'Next.js App Router + Kupola client hydration' },
        { title: 'Nuxt (Hybrid)', value: 'nuxt', description: 'Nuxt 3 + Kupola directives via ClientOnly' },
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
    features = [ 'dark' ];
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

  let hasDeps = false;
  if (skipInstall) {
    console.log(kleur.gray('\n  Skipping dependency installation.'));
  } else if (framework === 'gin') {
    console.log(kleur.cyan('\n  Installing dependencies...'));
    run('npm install', targetDir); // 安装前端 CSS/JS
    hasDeps = run('go mod tidy', targetDir); // 安装 Go 依赖
  } else {
    console.log(kleur.cyan('\n  Installing dependencies...'));
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
    nextjs: 'npx next dev',
    nuxt: 'npx nuxt dev',
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

const cliArgs = process.argv.slice(2);
if (cliArgs.includes('--help') || cliArgs.includes('-h')) {
  printHelp();
} else if (cliArgs.includes('--version') || cliArgs.includes('-v')) {
  console.log(VERSION);
} else {
  main().catch((err) => {
    console.error(kleur.red('\n  Error:'), err.message);
    process.exit(1);
  });
}
