// Renders scripts/art/out/*.svg to PNG with Chromium, then gen.py's webp step converts them.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const jobs = require(path.join(__dirname, "out/jobs.json"));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
  for (const j of jobs) {
    await p.setContent(`<html><body style="margin:0">${fs.readFileSync(j.svg, "utf8")}</body></html>`);
    await p.evaluate(() => document.fonts.ready);
    fs.mkdirSync(path.dirname(j.out), { recursive: true });
    await p.screenshot({ path: j.out.replace(/\.webp$/, ".png"), clip: { x: 0, y: 0, width: 800, height: 600 } });
  }
  await b.close();
})();
