const fs = require('fs');
const path = require('path');
const text = fs.readFileSync('lib/staticTranslations.ts', 'utf8');
const lines = text.split('\n');
let i = 0;
while (i < lines.length && !lines[i].includes('export const STATIC_TRANSLATIONS')) i++;
if (i >= lines.length) {
  console.error('not found');
  process.exit(1);
}
i += 1;
const langs = {};
while (i < lines.length) {
  const line = lines[i];
  const m = line.match(/^\s*(\w+):\s*\{/);
  if (m) {
    const lang = m[1];
    let brace = 1;
    const out = ['{'];
    i += 1;
    while (i < lines.length && brace > 0) {
      const l = lines[i];
      out.push(l);
      for (const ch of l) {
        if (ch === '{') brace++;
        else if (ch === '}') brace--;
      }
      i += 1;
    }
    // Remove trailing comma after the closing brace (source had `},` since this was a map entry)
    if (out.length > 0 && out[out.length - 1].trim() === '},') {
      out[out.length - 1] = '  }';
    }
    langs[lang] = out.join('\n');
    continue;
  }
  i += 1;
}
const outDir = 'lib/staticTranslations';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
for (const k of Object.keys(langs)) {
  const v = langs[k];
  fs.writeFileSync(path.join(outDir, `${k}.ts`), `export const STATIC_TRANSLATIONS = ${v};\n`, 'utf8');
}
const idxPath = 'lib/staticTranslations/index.ts';
let idx = '';
for (const k of Object.keys(langs)) {
  idx += `import { STATIC_TRANSLATIONS as ${k} } from './${k}';\n`;
}
idx += '\nexport const STATIC_TRANSLATIONS = { ' + Object.keys(langs).join(', ') + ' };\n';
fs.writeFileSync(idxPath, idx, 'utf8');
console.log('written', Object.keys(langs).length, 'languages');
