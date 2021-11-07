/* eslint-disable no-continue */
/* eslint-disable import/prefer-default-export */
import fs from 'fs';

// return a map with a key for each plugin name
export function loadPluginBenchmarks(filepath: string, pluginNames: string[]):Map<string, number[]> {
  const rows = fs.readFileSync(filepath, 'utf8').split('\n');

  const data: Map<string, number[]> = new Map();
  const colIdxs:number[] = [];

  pluginNames.forEach(pluginName => {
    const colIdx = rows[0].split(',').findIndex(col => col === pluginName);
    if (colIdx === -1) {
      throw new Error(`could not find plugin column ${pluginName}`);
    }
    colIdxs.push(colIdx);
    data.set(pluginName, []);
  });

  for (let rowIdx = 1; rowIdx < rows.length; rowIdx += 1) {
    const rowArr = rows[rowIdx].split(',');

    /*
    plot only succesfull scraped resources
    ignore scrape attempts resulting in concurrency errors like ,,,,,0
    */
    if (rowArr.find(val => val.length === 0) !== undefined) {
      continue;
    }

    if (rowArr.length > 1) {
      pluginNames.forEach(
        (pluginName, pluginIdx) => data.get(pluginName).push(parseInt(rowArr[colIdxs[pluginIdx]], 10)),
      );
    }
  }

  return data;
}

export function loadTotalTimes(filepath: string): number[] {
  const rows = fs.readFileSync(filepath, 'utf8').split('\n');
  return rows.slice(1).map(val => parseInt(val, 10));
}
