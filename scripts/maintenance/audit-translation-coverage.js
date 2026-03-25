const fs = require('fs');
const path = require('path');

const root = process.cwd();

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolutePath, acc);
    else acc.push(absolutePath);
  }
  return acc;
}

function collectTranslationKeys() {
  const files = walk(root).filter(
    (filePath) =>
      /\.(tsx|ts|jsx|js)$/.test(filePath) &&
      /\\(app|components|contexts)\\/.test(filePath)
  );

  const keyRegex = /\bt\(\s*(['"])((?:\\.|(?!\1).)*)\1\s*\)/g;
  const keys = new Set();

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = keyRegex.exec(content))) {
      const rawKey = match[2];
      const unescapedKey = rawKey.replace(/\\([\\'"`])/g, '$1');
      keys.add(unescapedKey);
    }
  }

  return keys;
}

function parseTranslationObject(fileContent) {
  const parsed = {};
  const entryRegex =
    /(?:^|\n)\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z0-9 _&?.!,:;()\-/]+))\s*:\s*(?:'([^']*)'|"([^"]*)")\s*,?/g;

  let match;
  while ((match = entryRegex.exec(fileContent))) {
    const key = (match[1] || match[2] || match[3] || '').trim();
    const value = match[4] ?? match[5] ?? '';
    if (key) parsed[key] = value;
  }

  return parsed;
}

function main() {
  const keys = collectTranslationKeys();
  const languages = ['es', 'fr', 'de', 'ja', 'ko', 'pt', 'hi', 'ar', 'zh'];

  const report = {};

  for (const language of languages) {
    const filePath = path.join(root, 'lib', 'staticTranslations', `${language}.ts`);
    const content = fs.readFileSync(filePath, 'utf8');
    const dictionary = parseTranslationObject(content);
    const missing = [...keys].filter((key) => !(key in dictionary));

    report[language] = {
      missingCount: missing.length,
      missing,
    };
  }

  const outputPath = path.join(root, 'scripts', 'maintenance', 'translation-coverage-report.json');
  fs.writeFileSync(outputPath, JSON.stringify({ totalKeys: keys.size, report }, null, 2));

  console.log(`Collected ${keys.size} translation keys.`);
  for (const language of languages) {
    console.log(`${language}: missing ${report[language].missingCount}`);
  }
  console.log(`Report written: ${outputPath}`);
}

main();
