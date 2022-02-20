import path from 'path';
import { JSDOM } from 'jsdom';
import * as d3 from 'd3';
import fetch from '../utils/node-fetch-file';
import LineChart from '../utils/LineChart';

global.fetch = <any>fetch;
const jsdom = (new JSDOM('<!DOCTYPE html><body></body>'));
global.document = jsdom.window.document;
global.window = <any>jsdom.window;

const dbClient = 'Postgresql';
const pkgVersion = '0.10.0';
const exportDir = 'charts';

async function loadData(file: string) {
  const content = await d3.text(`file://${file}`);
  let total = 0;
  const data = d3.csvParseRows<[number, number]>(content, (row, idx) => {
    total += parseInt(row[1], 10);
    return [ total, idx + 1 ];
  });

  data.splice(0, 0, [ 0, 0 ]);

  return data;
}

async function plotMultipleScrapersWithSavedEntries() {
  const benchmarks = [
    {
      filepath: 'results/_1000k_1project_1scraper_saved_resources/scraper-benchmark.csv',
      label: '1',
    },
    {
      filepath: 'results/_1000k_1project_2scraper_saved_resources/_take2/scraper-benchmark.csv',
      label: '2',
    },
    {
      filepath: 'results/_1000k_1project_4scraper_saved_resources/_take2/scraper-benchmark.csv',
      label: '4',
    },
    {
      filepath: 'results/_1000k_1project_8scraper_saved_resources/_take2/scraper-benchmark.csv',
      label: '8',
    },
  ];

  const chart = new LineChart({
    width: 700,
    height: 300,
    margin: {
      top: 30,
      right: 20,
      bottom: 50,
      left: 50,
    },
  });

  for (let i = 0; i < benchmarks.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const data = await loadData(benchmarks[i].filepath);
    chart.addSeries(data, benchmarks[i].label);
  }

  chart.plot();
  chart.save(path.join(exportDir, `v${pkgVersion}-total-exec-time-1e6-saved-entries.svg`));
}

async function plotSingleScrapersWithNewEntries() {
  const chart = new LineChart({
    width: 700,
    height: 300,
    margin: {
      top: 30,
      right: 20,
      bottom: 50,
      left: 50,
    },
  });

  const data = await loadData('results/_1000k_1project_1scraper_new_resources/scraper-benchmark.csv');
  chart.addSeries(data, '1');

  chart.plot();
  chart.save(path.join(exportDir, `v${pkgVersion}-total-exec-time-1e6-new-entries.svg`));
}

(async () => {
  await plotMultipleScrapersWithSavedEntries();
  await plotSingleScrapersWithNewEntries();
})();
