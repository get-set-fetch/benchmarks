import { Scraper, Resource, Plugin, ConcurrencyManager, ConcurrencyOptions } from '@get-set-fetch/scraper';
import BenchmarkHelper from './BenchmarkHelper';
import BenchmarkConcurrencyManager from './BenchmarkConcurrencyManager';

export default class BenchmarkScraper extends Scraper {
  benchmark = new BenchmarkHelper();

  async getResourceToScrape() {
    let scrapedResource;
    const elapsed = await this.benchmark.recordExecTime(
      async () => {
        scrapedResource = await super.getResourceToScrape();
      },
      this,
    );

    this.benchmark.addExecTime(scrapedResource ? scrapedResource.url : null, 'totalTime', elapsed);
    return scrapedResource;
  }

  initConcurrencyManager(concurrencyOpts:Partial<ConcurrencyOptions>):ConcurrencyManager {
    return new BenchmarkConcurrencyManager(concurrencyOpts, this.benchmark);
  }

  async executePlugin(resource: Resource, plugin: Plugin): Promise<void | Partial<Resource>> {
    let scrapedResource;

    const elapsed = await this.benchmark.recordExecTime(
      async () => {
        scrapedResource = await super.executePlugin(resource, plugin);
      },
      this,
    );
    this.benchmark.addExecTime(resource.url, plugin.constructor.name, elapsed);

    return scrapedResource;
  }
}
