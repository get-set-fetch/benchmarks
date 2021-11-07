/* eslint-disable import/prefer-default-export */
import fs from 'fs';
import { Chart, ChartConfiguration } from 'chart.js';
import { Canvas, createCanvas } from 'canvas';

export default class ProgressiveChart {
  static COLORS = [
    '#4dc9f6',
    '#f67019',
    '#f53794',
    '#537bc4',
    '#acc236',
    '#166a8f',
    '#00a950',
    '#58595b',
    '#8549ba',
  ];

  canvas: Canvas;
  chart: Chart;

  constructor(title: string, resourceNo:number) {
    this.canvas = createCanvas(800, 300);
    const context = this.canvas.getContext('2d');

    this.chart = new Chart(context, this.getLineConfig(title, resourceNo));
  }

  getLineConfig(title: string, resourceNo: number):ChartConfiguration {
    return {
      type: 'line',
      options: {
        responsive: false,
        animation: false,
        // parsing: true,

        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: false,
            text: title,
          },
          // decimation: {
          //   algorithm: 'lttb',
          //   enabled: true,
          //   samples: 100,
          //   threshold: 50,
          // },
        },
        scales: {
          x: {
            type: 'linear',
            min: 0,
            title: {
              display: true,
              text: 'Scraped Resources',
              color: '#333',
              font: {
                size: 16,
              },
            },
            ticks: {
              color: '#333',
            },
          },
          y: {
            type: 'linear',
            min: 0,
            title: {
              display: true,
              text: 'Minutes',
              color: '#333',
              font: {
                size: 16,
              },
            },
            ticks: {
              color: '#333',
            },
          },
        },
      },
      data: {
        datasets: [],
      },
    };
  }

  addDatasets(prefix: string, data: Map<string, number[]>) {
    Array.from(data.keys()).forEach(pluginName => {
      this.chart.data.datasets.push({
        label: `${prefix}-${pluginName}`,
        data: data.get(pluginName).map(val => val),
        backgroundColor: ProgressiveChart.COLORS[this.chart.data.datasets.length % ProgressiveChart.COLORS.length],
        // borderColor: ProgressiveChart.COLORS[this.chart.data.datasets.length % ProgressiveChart.COLORS.length],

        indexAxis: 'x',
        pointBorderWidth: 0,
        pointRadius: 0,
      });
    });

    this.chart.update();
  }

  addAvgPluginExecTimeDataset(label: string, data: number[]) {
    this.chart.data.datasets.push({
      label,
      data: data.map(val => val),
      borderColor: ProgressiveChart.COLORS[this.chart.data.datasets.length % ProgressiveChart.COLORS.length],

      indexAxis: 'x',
      pointBorderWidth: 0,
      pointRadius: 0,
    });

    this.chart.update();
  }

  addTotalExecTimes(label: string, data:number[], step:number = 1e3) {
    this.chart.data.datasets.push({
      label,
      data: data.map((elapsed, idx) => ({ x: idx * step, y: elapsed / 1e3 / 60 })),
      borderColor: ProgressiveChart.COLORS[this.chart.data.datasets.length % ProgressiveChart.COLORS.length],

      borderWidth: 2,
      borderCapStyle: 'round',
      showLine: true,
      cubicInterpolationMode: 'monotone',

      pointBorderWidth: 0,
      pointRadius: 0,
      pointBackgroundColor: '#f0f',
    });

    this.chart.update();
  }

  exportAsImage(filepath: string):Promise<void> {
    const image = this.canvas.toBuffer('image/png', { compressionLevel: 0 });

    return new Promise<void>((resolve, reject) => {
      fs.writeFile(filepath, image, { encoding: 'binary' }, err => {
        if (err) {
          reject(err);
        }
        else {
          resolve();
        }
      });
    });
  }
}

export async function drawChart(config: ChartConfiguration, filepath: string) {
  const canvas = createCanvas(800, 800);
  const context = canvas.getContext('2d');
  const chart = new Chart(context, config);
  chart.update();

  const image = canvas.toBuffer('image/png', { compressionLevel: 0 });

  return new Promise<void>((resolve, reject) => {
    fs.writeFile(filepath, image, { encoding: 'binary' }, err => {
      if (err) {
        reject(err);
      }
      else {
        resolve();
      }
    });
  });
}

export function getLineChartConfig(title: string, data: Map<string, number[]>):ChartConfiguration {
  const config:ChartConfiguration = {
    type: 'line',
    options: {
      responsive: false,
      animation: false,
      parsing: false,

      plugins: {
        title: {
          display: true,
          text: title,
        },
        decimation: {
          algorithm: 'lttb',
          enabled: true,
          samples: 100,
          // threshold: 50,
        },
      },

      scales: {
        x: {
          type: 'linear',
          // grace: '5%',
        },
        y: {
          type: 'linear',
          min: 0,
          max: 150,
        },
      },
    },
    data: {
      labels: data.get(Array.from(data.keys())[0]).map((val, idx) => idx),
      datasets: Array.from(data.keys()).map((pluginName, idx) => ({
        label: pluginName,
        data: data.get(pluginName).map((val, idx) => ({ x: idx, y: val })),
        borderColor: ProgressiveChart.COLORS[idx],

        indexAxis: 'x',

        pointBorderWidth: 0,
        pointRadius: 0,
      })),
    },

  };

  return config;
}
