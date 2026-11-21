import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { options } from './browser.mjs';
import { auditRoutes } from './audit-routes.mjs';
import { gates, runLighthouse } from './lighthouse.mjs';
import { runAxe } from './axe.mjs';
import { limits } from '../budgets.mjs';

const { out } = await options();
const report = { pass: false, gates: { ...gates, axeViolations: 0, ...limits }, routes: [], pending: [], lighthouse: [], axe: [] };
const save = (name, value) => writeFile(join(out, name + '.json'), JSON.stringify(value, null, 2) + '\n');
try {
  Object.assign(report, await auditRoutes());
  const languages = ['it', 'en'];
  // Run serially so the accessibility browser never competes with a performance trace.
  report.lighthouse = await runLighthouse(report.routes, languages);
  await save('lighthouse', report.lighthouse);
  report.axe = await runAxe(report.routes, languages);
  await save('axe', report.axe);
  const expected = report.routes.length * languages.length * 2;
  report.pass = expected > 0 && [report.lighthouse, report.axe].every(rows => rows.length === expected && rows.every(row => row.pass));
} catch (error) { report.error = error.message; }
await save('audit', report);
console.log(report.pass ? 'PASS' : 'FAIL', 'release audit:', report.routes.map(route => route.path).join(', '), report.error || '');
if (!report.pass) process.exitCode = 1;
