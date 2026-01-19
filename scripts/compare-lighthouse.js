const fs = require('fs');
const path = require('path');

const reportsDir = path.resolve(__dirname, '..', 'lighthouse-reports');
const metrics = ['performance', 'accessibility', 'best-practices', 'seo'];

// Get the expected number of reports per run from lighthouserc.json (fallback to 9)
function getExpectedCount() {
  try {
    const rc = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'lighthouserc.json'), 'utf8'));
    const urls = rc?.ci?.collect?.url;
    if (Array.isArray(urls) && urls.length > 0) return urls.length;
  } catch (_) {}
  return 9;
}

function loadRun(files) {
  const scoresByUrl = {};
  files.forEach((file) => {
    try {
      const json = JSON.parse(fs.readFileSync(path.join(reportsDir, file), 'utf8'));
      if (!json.categories) return;
      const url = json.finalUrl || json.requestedUrl || file;
      scoresByUrl[url] = {};
      metrics.forEach((metric) => {
        const score = json.categories[metric]?.score;
        scoresByUrl[url][metric] = typeof score === 'number' ? Math.round(score * 100) : null;
      });
    } catch (err) {
      // Ignore malformed files
    }
  });
  return scoresByUrl;
}

function chunkRuns(files, expectedPerRun) {
  const runs = [];
  // walk from oldest to newest, grouping exact batches
  for (let i = 0; i + expectedPerRun <= files.length; i += expectedPerRun) {
    const slice = files.slice(i, i + expectedPerRun);
    runs.push(slice.map((f) => f.name));
  }
  return runs;
}

function labelForRun(fileName) {
  // try to extract the timestamp from the filename; fallback to file name
  const match = fileName.match(/-([0-9]{4}_[0-9]{2}_[0-9]{2}_[0-9]{2}_[0-9]{2}_[0-9]{2})\.report\.json$/);
  return match ? match[1] : fileName;
}

function main() {
  if (!fs.existsSync(reportsDir)) {
    console.log('No lighthouse-reports directory found.');
    return;
  }

  const files = fs
    .readdirSync(reportsDir)
    .filter((f) => f.endsWith('.report.json') && !f.includes('manifest'))
    .map((name) => ({
      name,
      mtime: fs.statSync(path.join(reportsDir, name)).mtimeMs,
    }))
    .sort((a, b) => a.mtime - b.mtime);

  const expectedPerRun = getExpectedCount();
  if (files.length < expectedPerRun * 2) {
    console.log(`Need at least two runs (${expectedPerRun} reports each) to compare.`);
    return;
  }

  const runs = chunkRuns(files, expectedPerRun);
  if (runs.length < 2) {
    console.log(`Need at least two complete runs (${expectedPerRun} reports each) to compare.`);
    return;
  }

  const currFiles = runs[runs.length - 1];
  const prevFiles = runs[runs.length - 2];

  const prevRun = loadRun(prevFiles);
  const currRun = loadRun(currFiles);

  const currLabel = labelForRun(currFiles[0]);
  const prevLabel = labelForRun(prevFiles[0]);
  console.log(`\n=== Lighthouse Comparison (previous -> current) ===`);
  console.log(`Prev sample: ${prevLabel}`);
  console.log(`Curr sample: ${currLabel}\n`);
  console.log(`${'Page'.padEnd(45)} ${'Metric'.padEnd(15)} ${'Prev'.padEnd(6)} ${'New'.padEnd(6)} ${'Δ'.padEnd(4)}`);
  console.log('='.repeat(80));

  const urls = Object.keys(currRun).sort();
  let changesPrinted = 0;

  urls.forEach((url) => {
    if (!prevRun[url]) return;
    const page = url.split('4000')[1] || '/';
    let pagePrinted = false;

    metrics.forEach((metric) => {
      const prev = prevRun[url][metric];
      const curr = currRun[url][metric];
      if (prev == null || curr == null) return;
      if (prev === curr) return;
      const delta = curr - prev;
      const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
      if (!pagePrinted) {
        console.log();
        pagePrinted = true;
      }
      console.log(`${page.padEnd(45)} ${metric.padEnd(15)} ${String(prev).padEnd(6)} ${String(curr).padEnd(6)} ${deltaStr.padEnd(4)}`);
      changesPrinted += 1;
    });
  });

  if (changesPrinted === 0) {
    console.log('No score changes between the last two runs.');
  }

  // Full table of all runs (from oldest to newest)
  console.log('\n=== All Runs (scores) ===');
  runs.forEach((runFiles, idx) => {
    const label = labelForRun(runFiles[0]);
    const runData = loadRun(runFiles);
    console.log(`\nRun ${idx + 1}: ${label}`);
    console.log(`${'Page'.padEnd(45)} ${'Perf'.padEnd(6)} ${'A11y'.padEnd(6)} ${'BP'.padEnd(6)} ${'SEO'.padEnd(6)}`);
    console.log('-'.repeat(75));
    Object.keys(runData)
      .sort()
      .forEach((url) => {
        const page = url.split('4000')[1] || '/';
        const s = runData[url];
        const perf = s.performance ?? '-';
        const a11y = s['accessibility'] ?? '-';
        const bp = s['best-practices'] ?? '-';
        const seo = s.seo ?? '-';
        console.log(`${page.padEnd(45)} ${String(perf).padEnd(6)} ${String(a11y).padEnd(6)} ${String(bp).padEnd(6)} ${String(seo).padEnd(6)}`);
      });
  });
}

main();
