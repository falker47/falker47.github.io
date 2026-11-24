import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const sources = join(homedir(), 'sources');
const portfolio = join(sources, 'Nexus-portfolio', 'assets');
const sharp = createRequire(join(homedir(), 'qa-tools', 'package.json'))('sharp');
const projectSources = {
  'prof-gecko': 'projects/prof-gecko.jpg',
  'camaleonte': 'projects/camaleonte-3-2-ratio.webp',
  'social-viewer': 'socialviewer/testers-preview.webp',
  'chi-l-ha-detto': 'projects/chilhadetto.webp',
  'diario-di-bordo': 'projects/diario-di-bordo-preview.webp',
  'easy-contract': 'projects/easycontract.webp',
  'zerofilez': 'projects/zerofilez.webp',
  'pokemon-mystery-dungeon-tools': 'projects/PMD.webp',
  'carte-senza-umanita': 'projects/csu_preview.webp',
  'panacea': 'projects/panacea.webp',
  'iban-checker': 'projects/iban-checker.webp',
  'codice-fiscale': 'projects/codice-fiscale.webp',
  'sommatrix': 'projects/sommatrix.webp',
  'crack-the-code': 'projects/crack-the-code.webp',
  'ringmin': 'projects/ringmin.webp',
};
const certificateSources = {
  'ai-and-machine-learning-engineering': 'certifications/Cert Microsoft AI & ML DR1IFS0JOA2H-full.webp',
  'data-science-professional-course': 'certifications/Certificate IBM Data Science Coursera UAD9R68X3KPX-full.webp',
  'blockchain-project-lead-specialization': 'certifications/Masterz-Spec 3300x2550-full.webp',
  'blockchain-and-digital-assets-course': 'certifications/Cert-5-ED-Master-Z-MAURIZIO-FALCONI 3300x2550-full.webp',
  'sas-programming-course': 'certifications/Certificate_SAS-1-full.webp',
  'data-structures-and-algorithms': 'certifications/Certificate-Data-Structures-and-Algorithms-full.webp',
  'financial-technology-specialization': 'certifications/Certificate-Fintech-Spec-P6-DZAVHWT3-U4-full.webp',
  'cybersecurity-professional-course': 'certifications/Certificate Google Cybersecurity Coursera 35X5VFX574YU-full.webp',
  'french-b2-2-certificate': 'certifications/French-Certif-B2-full.webp',
  'advanced-english-c1-equivalent': 'certifications/Certificate Advanced English Coursera 7PGZG57X3H9R-full.webp',
  'fullstack-developer-certification': 'certifications/Attestato Blazar Maurizio Falconi 2200x1700-full.webp',
};
const heroes = new Set(['ringmin', 'prof-gecko', 'camaleonte', 'social-viewer']);
const assets = new Map();
const data = {};
for (const name of ['projects', 'mods', 'certifications', 'profile']) {
  data[name] = JSON.parse(await readFile(join(root, 'data', name + '.json'), 'utf8'));
}

const generatedPrefixes = new Map();

async function sourceFrame(input, cropPosition) {
  const meta = await sharp(input).metadata();
  const original = meta.autoOrient ?? meta;
  const crop = cropPosition && Math.abs(original.width / original.height / (16 / 9) - 1) > 0.05;
  // Cropping a wide source to 16:9 also limits the available horizontal pixels.
  const nativeWidth = crop ? Math.min(original.width, Math.floor(original.height * 16 / 9)) : original.width;
  return { nativeWidth, crop: crop && cropPosition };
}

async function rendition(input, directory, filename, width, crop) {
  const resize = crop ? { width, height: Math.round(width * 9 / 16), fit: 'cover', position: crop } : { width };
  const { data: bytes, info } = await sharp(input).rotate().resize({ ...resize, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 }).toBuffer({ resolveWithObject: true });
  const src = '/assets/' + directory + '/' + filename + '.webp';
  if (bytes.length > 300_000) throw Error(src + ' exceeds 300 KB');
  assets.set(src, bytes);
  return { src, width: info.width, height: info.height };
}

async function responsive(input, directory, id, alt, widths, cropPosition) {
  const { nativeWidth, crop } = await sourceFrame(input, cropPosition);
  const variants = [];
  for (const width of new Set(widths.map(target => Math.min(target, nativeWidth)))) {
    variants.push(await rendition(input, directory, id + '-' + width, width, crop));
  }
  if (!generatedPrefixes.has(directory)) generatedPrefixes.set(directory, new Set());
  generatedPrefixes.get(directory).add(id);
  return { ...variants[0], nativeWidth, alt, variants };
}

for (const project of data.projects) {
  // The source catalogue illustrates the extension with a symbol. Reuse the parent diagram.
  const id = project.id === 'power-ringmin' ? 'ringmin' : project.id;
  const input = join(portfolio, projectSources[id]);
  const widths = heroes.has(project.id) ? [480, 960, 1440] : [480, 960];
  project.cover = await responsive(input, 'projects', id, project.cover.alt, widths, id === 'social-viewer' ? 'left' : 'centre');
}

for (const mod of data.mods.items) {
  const input = mod.id === 'hogwarts-legacy-save-editor'
    ? join(portfolio, 'projects', 'HLSE.webp') : join(sources, 'mods', mod.id + '.png');
  mod.cover = await responsive(input, 'mods', mod.id, mod.cover.alt, [480, 960], 'centre');
}

for (const cert of data.certifications) {
  // Use the same complete document for the thumbnail and the legible full view.
  const input = join(portfolio, certificateSources[cert.id]);
  const { nativeWidth } = await sourceFrame(input);
  // Cards render 150 CSS px wide: 300 px covers 2x screens, 480 px the denser ones.
  const small = await rendition(input, 'certifications', cert.id + '-thumb-300', Math.min(300, nativeWidth));
  const large = await rendition(input, 'certifications', cert.id + '-thumb', Math.min(480, nativeWidth));
  cert.thumbnail = { ...small, variants: [small, large] };
  cert.full = await rendition(input, 'certifications', cert.id + '-full', Math.min(960, nativeWidth));
}

const portrait = join(portfolio, 'profile', 'maurizio-falconi-falker47.webp');
data.profile.photo = await responsive(portrait, 'profile', 'maurizio-falconi', data.profile.photo.alt, [480, 960]);

const total = [...assets.values()].reduce((sum, bytes) => sum + bytes.length, 0);
if (total > 4_000_000) throw Error('Images exceed the 4 MB budget: ' + total);
const outputs = new Map([...assets].map(([src, bytes]) => [join(root, src.slice(1)), bytes]));
const icon = await sharp(join(root, 'assets/images/falkerlogo-native.webp')).resize(32, 32, { withoutEnlargement: true })
  .webp({ quality: 80, effort: 6 }).toBuffer();
outputs.set(join(root, 'assets/images/favicon-32.webp'), icon);
for (const [name, value] of Object.entries(data)) {
  outputs.set(join(root, 'data', name + '.json'), Buffer.from(JSON.stringify(value, null, 2) + '\n'));
}

// Finish every encode and budget check before publishing. Replace complete files atomically.
let changed = 0;
for (const [path, bytes] of outputs) {
  const prior = await readFile(path).catch(error => {
    if (error.code !== 'ENOENT') throw error;
  });
  if (prior?.equals(bytes)) continue;
  await mkdir(dirname(path), { recursive: true });
  const temporary = path + '.' + randomUUID() + '.tmp';
  try {
    await writeFile(temporary, bytes, { flag: 'wx' });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
  changed++;
}
// Retire only numbered renditions owned by this generator, after publishing all references.
for (const [directory, ids] of generatedPrefixes) {
  for (const file of await readdir(join(root, 'assets', directory))) {
    const match = /^(.*)-\d+\.webp$/.exec(file);
    if (match && ids.has(match[1]) && !assets.has(`/assets/${directory}/${file}`)) {
      await rm(join(root, 'assets', directory, file));
      changed++;
    }
  }
}
console.log(`${assets.size} WebPs, ${total} bytes, ${changed} files updated.`);
