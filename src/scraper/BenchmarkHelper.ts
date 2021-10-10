import fs from 'fs';

export default class BenchmarkHelper {
  execTimes: Map<string, bigint[]> = new Map();

  async recordExecTime(key: string, fnc:Function, fncThis) {
    const startTime = process.hrtime.bigint();

    await fnc.apply(fncThis);
    const endTime = process.hrtime.bigint();

    if (!this.execTimes.has(key)) {
      this.execTimes.set(key, []);
    }
    this.execTimes.get(key).push((endTime - startTime) / BigInt(1e6));
  }

  async exportExecTimes(csvPath: string) {
    if (this.execTimes.size === 0) {
      console.log('no execution time recorded, nothing to export');
      return;
    }

    const wstream = fs.createWriteStream(csvPath);

    // write header
    const keys = Array.from(this.execTimes.keys());
    wstream.write(`${keys.join(',')}\n`);

    // write body
    const rowNo = this.execTimes.get(keys[0]).length;
    for (let rowIdx = 0; rowIdx < rowNo; rowIdx += 1) {
      const rowValues = keys.map(key => this.execTimes.get(key)[rowIdx]);
      wstream.write(`${rowValues.join(',')}\n`);
    }
  }
}
