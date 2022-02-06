import { ConcurrencyManager, ConcurrencyOptions, Project, Resource } from '@get-set-fetch/scraper';
import BenchmarkHelper from './BenchmarkHelper';

export default class BenchmarkConcurrencyManager extends ConcurrencyManager {
  benchmark: BenchmarkHelper;

  constructor(concurrencyOpts:Partial<ConcurrencyOptions>, benchmark: BenchmarkHelper) {
    super(concurrencyOpts);
    this.benchmark = benchmark;
  }

  async getResourceToScrape(project:Project):Promise<Resource> {
    let resource:Resource;

    const elapsed = await this.benchmark.recordExecTime(
      async () => {
        resource = await super.getResourceToScrape(project);
      },
      this,
    );
    this.benchmark.addExecTime(resource ? resource.url : null, 'getResourceToScrape', elapsed);

    return resource;
  }
}
