/* eslint-disable no-template-curly-in-string */
/* for standalone projects replace '../../src/index' with '@get-set-fetch/scraper' */
import fs from 'fs';
import { destination } from 'pino';
import { Project, setLogger, ScrapeEvent, CsvExporter } from '@get-set-fetch/scraper';
import { version as pkgVersion } from '@get-set-fetch/scraper/package.json';
import BenchmarkScraper from './scraper/BenchmarkScraper';

type DbClient = 'sqlite'|'pg';

function benchmark(dbClient: DbClient, resourceNo: number) {
  const config = JSON.parse(fs.readFileSync(`config/config-${dbClient}.json`, 'utf8'));

  // update config
  config.project.pluginOpts.find(plugin => plugin.name === 'PerfNodeFetchPlugin').maxResources = resourceNo;

  if (dbClient === 'sqlite') {
    config.storage.connection.filename = config.storage.connection.filename
      .replace('${pkgVersion}', pkgVersion)
      .replace('${resourceNo}', resourceNo.toExponential());
    console.log(`using data directory: ${config.storage.connection.filename}`);
  }

  // each scenario has its own data dir, create if not already present
  const dataDir = `results/${pkgVersion}/${dbClient}/${resourceNo.toExponential()}`;
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // write all INFO and above messages to 'scrape.log'
  setLogger({ level: 'error' }, destination(`results/${pkgVersion}/${dbClient}/${resourceNo.toExponential()}/scrape.log`));

  /* create a scraper instance with the above settings */
  const scraper = new BenchmarkScraper(config.storage, config.client);

  scraper.on(ScrapeEvent.ProjectScraped, async (project: Project) => {
    await scraper.benchmark.exportScrapeResourceExecTimes(`results/${pkgVersion}/${dbClient}/${resourceNo.toExponential()}/scrape-resource-exec-times.csv`);
    await scraper.benchmark.exportTotalExecTimes(`results/${pkgVersion}/${dbClient}/${resourceNo.toExponential()}/total-exec-times.csv`);

    const exporter = new CsvExporter({ filepath: `results/${pkgVersion}/${dbClient}/${resourceNo.toExponential()}/mocked-content.csv` });
    await exporter.export(project);
  });

  /* start scraping by specifying project and concurrency settings */
  scraper.scrape(config.project, config.concurrency);
}

/*
1e6 log should always be on error
*/
benchmark('sqlite', 1e+4);
