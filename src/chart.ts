/* eslint-disable no-template-curly-in-string */
/* for standalone projects replace '../../src/index' with '@get-set-fetch/scraper' */
import fs from 'fs';
import { version as pkgVersion } from '@get-set-fetch/scraper/package.json';
import { loadPluginBenchmarks } from './utils/data-utils';
import ProgressiveChart from './utils/chart-utils';

const availablePkgVersions = [ '0.7.1', '0.7.2' ];
type DbClient = 'sqlite'|'pg';

function doAvg(data: number[], step: number):number[] {
  const avg: number[] = [];
  for (let i = 0; i < Math.ceil(data.length / step); i += 1) {
    const stepArr = data.slice(i * step, (i + 1) * step);
    const stepAvg = stepArr.reduce((prev, curr) => prev + curr);
    avg.push(Math.floor(stepAvg / stepArr.length));
  }

  return avg;
}

function generateLineChartMultipleDB(pluginName: string, resourceNo: number, step = 1e3) {
  const sqliteData = loadPluginBenchmarks(
    `results/${pkgVersion}/sqlite/${resourceNo.toExponential()}/exec-times.csv`,
    [ pluginName ],
  );

  const pgData = loadPluginBenchmarks(
    `results/${pkgVersion}/pg/${resourceNo.toExponential()}/exec-times.csv`,
    [ pluginName ],
  );

  const chartHelper = new ProgressiveChart(`v${pkgVersion} - ${pluginName}`, Math.floor(resourceNo / step));
  chartHelper.addDataset(`sqlite-${pluginName}`, doAvg(sqliteData.get(pluginName), step));
  chartHelper.addDataset(`pg-${pluginName}`, doAvg(pgData.get(pluginName), step));

  chartHelper.exportAsImage(`v${pkgVersion}-${resourceNo.toExponential()}-${pluginName}.png`);
}

function generateLineChart(dbClient: DbClient, resourceNo: number, pluginName: string, step = 1e3) {
  const chartHelper = new ProgressiveChart(`${dbClient} - ${pluginName}`, Math.floor(resourceNo / step));

  availablePkgVersions.forEach(pkgVersion => {
    const execTimeFilename = `results/${pkgVersion}/${dbClient}/${resourceNo.toExponential()}/exec-times.csv`;
    if (fs.existsSync(execTimeFilename)) {
      const data = loadPluginBenchmarks(
        execTimeFilename,
        [ pluginName ],
      );
      chartHelper.addDataset(`v${pkgVersion}`, doAvg(data.get(pluginName), step));
    }
  });

  chartHelper.exportAsImage(`${dbClient}-${resourceNo.toExponential()}-${pluginName}.png`);
}

// use pluginNames like `InsertResourcesPlugin`, `UpsertResourcePlugin` or `totalTime`
generateLineChart('pg', 3e4, 'InsertResourcesPlugin');
