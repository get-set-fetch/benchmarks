import fs from 'fs';
import { join } from 'path';
import ProgressiveChart from '../utils/chart-utils';

const pkgVersion = '0.10';
const dbClient = 'Postgresql';
const workDir = 'results';

async function loadScrapedResourcesPerMinute(filepath: string): Promise<number[]> {
  const rows = fs.readFileSync(filepath, 'utf8').split('\n');
  return rows.filter(row => row).map(row => parseInt(row.split(',')[1], 10));
}

(async () => {
  const scrapedPerMinute: number[] = await loadScrapedResourcesPerMinute(join(workDir, 'scraper-benchmark.csv'));
  let scrapedTotal = 0;
  const cummulativePerMinute = scrapedPerMinute.map(perMinute => {
    scrapedTotal += perMinute;
    return scrapedTotal;
  });

  const chartHelper = new ProgressiveChart('Total Scrape Time', Math.floor(scrapedPerMinute.length));
  chartHelper.addCummulativePerMinute(`v${pkgVersion}-${dbClient}`, [ 0, ...cummulativePerMinute ]);

  chartHelper.exportAsImage(join(workDir, `total-exec-time-${scrapedTotal.toExponential()}.png`));
})();
