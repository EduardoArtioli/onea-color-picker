const fs = require('fs/promises');
const { existsSync } = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const outDir = 'lib',
  sourceDir = 'src',
  modulePath = path.join(outDir, 'module'),
  commonjsPath = path.join(outDir, 'commonjs'),
  typescriptPath = path.join(outDir, 'typescript'),
  babelConfigPath = path.join('scripts', 'babel.config.js');

async function cleanOutDirectory() {
  const isExists = existsSync(outDir);
  if (!isExists) return;
  await fs.rm(outDir, { recursive: true });
}

async function buildTypescript() {
  await execPromise(`npx tsc --declarationDir ${typescriptPath} --emitDeclarationOnly --declaration --declarationMap`);
  await execPromise(`npx resolve-tspaths --out ${typescriptPath}`);
}

async function buildModuleJs() {
  process.env.MODULES = '';
  await execPromise(
    `npx babel --config-file ./${babelConfigPath} --out-dir ${modulePath} ${sourceDir} --ignore "${path.join(
      sourceDir,
      '/**/*.d.ts'
    )}" --extensions ".ts,.tsx" --source-maps --copy-files --no-copy-ignored`
  );
}

async function buildCommonJs() {
  process.env.MODULES = 'commonjs';
  await execPromise(
    `npx babel --config-file ./${babelConfigPath} --out-dir ${commonjsPath} ${sourceDir} --ignore "${path.join(
      sourceDir,
      '/**/*.d.ts'
    )}" --extensions ".ts,.tsx" --source-maps --copy-files --no-copy-ignored`
  );
}

async function prettier() {
  const buildDir = path.join(outDir, '**/*.js');
  const typescriptDir = path.join(typescriptPath, '**/*.d.ts');
  await execPromise(`npx prettier --write ${buildDir}`);
  await execPromise(`npx prettier --write ${typescriptDir}`);
}

async function build() {
  try {
    console.log(`🧹 Cleaning the "${outDir}" folder ...\n`);
    await cleanOutDirectory();
  } catch (error) {
    console.error('⛔', error);
    process.exit(1);
  }

  try {
    console.log('📦 Generating Typescript .d.ts files ...\n');
    await buildTypescript();
  } catch (error) {
    console.error('⛔', error);
    process.exit(1);
  }

  try {
    console.log('📦 Compiling JavaScript module files ...\n');
    await buildModuleJs();
  } catch (error) {
    console.error('⛔', error);
    process.exit(1);
  }

  try {
    console.log('📦 Compiling JavaScript commonjs files ...\n');
    await buildCommonJs();
  } catch (error) {
    console.error('⛔', error);
    process.exit(1);
  }

  try {
    console.log('💄 Formatting compiled files with Prettier ...\n');
    await prettier();
  } catch (error) {
    console.error('⛔', error);
    process.exit(1);
  }
}

build();
