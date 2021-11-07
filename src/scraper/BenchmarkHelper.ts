import fs from 'fs';

/**
Scraping is async, we can't rely on incoming plugin execution order to compute a url total scraping time.
Group all scraping operations for a given url under a common url key.
*/
export default class BenchmarkHelper {
  scrapeResourceExecTimes: bigint[][] = [];
  totalExecTimes: bigint[] = [];
  execKeys: string[];
  inProgressExecTimes: Map<string, Map<string, bigint>> = new Map();
  resourceNo:number = 0;

  async recordExecTime(fnc:Function, fncThis):Promise<bigint> {
    const startTime = process.hrtime.bigint();

    await fnc.apply(fncThis);
    const endTime = process.hrtime.bigint();
    const elapsedTimeMs = (endTime - startTime) / BigInt(1e6);
    return elapsedTimeMs;
  }

  async addExecTime(url: string, key: string, elapsedTimeMs) {
    // succesfull scraping
    if (url) {
      if (!this.inProgressExecTimes.has(url)) {
        this.inProgressExecTimes.set(url, new Map());
      }

      const inProgressExecTime = this.inProgressExecTimes.get(url);
      inProgressExecTime.set(key, elapsedTimeMs);

      if (key === 'totalTime') {
        if (!this.execKeys) {
          // have totalTime as last column
          this.execKeys = Array.from(inProgressExecTime.keys()).sort((keyA, keyB) => {
            if (keyA === 'totalTime') return 1;
            if (keyB === 'totalTime') return -1;
            return 0;
          });
        }

        // record resource scraping exec time
        this.scrapeResourceExecTimes.push(this.execKeys.map(execKey => inProgressExecTime.get(execKey)));
        this.inProgressExecTimes.delete(url);

        this.resourceNo += 1;

        // record total times
        if (this.resourceNo === 1 || this.resourceNo % 1000 === 0) {
          console.log(`resourceNo: ${this.resourceNo}`);
          this.totalExecTimes.push(process.hrtime.bigint());
        }
      }
    }
    // error was thrown, just record totalTime, can't handle multiple intermediateExecTimes with null url key
    else {
      if (key === 'totalTime' && this.execKeys) {
        const intermediateExecTime = new Map<string, bigint>();
        intermediateExecTime.set(key, elapsedTimeMs);
        this.scrapeResourceExecTimes.push(this.execKeys.map(execKey => intermediateExecTime.get(execKey)));
      }
    }
  }

  async exportScrapeResourceExecTimes(csvPath: string) {
    if (this.scrapeResourceExecTimes.length === 0) {
      console.log('no execution time recorded, nothing to export');
      return;
    }

    const wstream = fs.createWriteStream(csvPath);

    // write header
    wstream.write(`${this.execKeys.join(',')}\n`);

    // write body
    for (let rowIdx = 0; rowIdx < this.scrapeResourceExecTimes.length; rowIdx += 1) {
      wstream.write(`${this.scrapeResourceExecTimes[rowIdx].join(',')}\n`);
    }
  }

  async exportTotalExecTimes(csvPath: string) {
    if (this.totalExecTimes.length === 0) {
      console.log('no execution time recorded, nothing to export');
      return;
    }

    const wstream = fs.createWriteStream(csvPath);

    // write header
    wstream.write('TimePer1kScrapeResources');

    // write body
    for (let rowIdx = 0; rowIdx < this.totalExecTimes.length; rowIdx += 1) {
      const elapsedTimeMs = (this.totalExecTimes[rowIdx] - this.totalExecTimes[0]) / BigInt(1e6);
      wstream.write(`\n${elapsedTimeMs}`);
    }
  }
}
