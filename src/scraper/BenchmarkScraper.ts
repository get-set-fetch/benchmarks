import { Scraper, Resource, Plugin } from '@get-set-fetch/scraper';
import BenchmarkHelper from './BenchmarkHelper';

export default class BenchmarkScraper extends Scraper {
  benchmark = new BenchmarkHelper();

  async scrapeResource(resource: Resource) {
    await this.benchmark.recordExecTime(
      'totalTime',
      async () => {
        await super.scrapeResource(resource);
      },
      this,
    );
  }

  async executePlugin(resource: Resource, plugin: Plugin): Promise<void | Partial<Resource>> {
    let scrapedResource;

    await this.benchmark.recordExecTime(
      plugin.constructor.name,
      async () => {
        scrapedResource = await super.executePlugin(resource, plugin);
      },
      this,
    );

    return scrapedResource;
  }
}
