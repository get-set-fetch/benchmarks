import fs from 'fs';
import * as d3 from 'd3';

export type Layout = {
  width: number,
  height: number,
  margin: {
    left: number,
    top: number,
    right: number,
    bottom: number
  },
  boundedWidth? : number,
  boundedHeight?: number
}

export type DomainBounds = {
  minX: number,
  maxX: number,
  minY: Number,
  maxY: number
}

export default class LineChart {
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

  layout: Layout;

  wrapper: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  bounds: d3.Selection<SVGElement, unknown, HTMLElement, any>;

  dataSeries: [number, number][][];
  legend: string[];

  xScale: d3.ScaleLinear<number, number, never>;
  yScale: d3.ScaleLinear<number, number, never>;

  constructor(layout: Layout) {
    this.layout = layout;
    this.layout.boundedWidth = this.layout.boundedWidth || layout.width - layout.margin.left - layout.margin.right;
    this.layout.boundedHeight = this.layout.boundedHeight || layout.height - layout.margin.top - layout.margin.bottom;

    this.wrapper = d3
      .select('body')
      .append('svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('width', this.layout.width)
      .attr('height', this.layout.height);

    this.wrapper.append('style')
      .text(`<![CDATA[
        @import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');
        text {
            font-family: "Roboto, -apple-system, BlinkMacSystemFont, Tahoma, sans-serif";
        }
        .axis-label {
            font-size: 1.3em;
        }
        .legend {
            font-size: 1.1em;
        }
    ]]>`);

    this.wrapper
      .append('rect')
      .attr('fill', 'white')
      .attr('width', '100%')
      .attr('height', '100%');

    this.bounds = this.wrapper
      .append('g')
      .style(
        'transform',
        `translate(${this.layout.margin.left}px,${this.layout.margin.top}px)`,
      );

    this.dataSeries = [];
    this.legend = [];
  }

  addSeries(data: [number, number][], legend: string) {
    this.dataSeries.push(data);
    this.legend.push(legend);
    this.updateScales();
  }

  updateScales() {
    const { minX, maxX, minY, maxY } = this.dataSeries.reduce<DomainBounds>(
      (bounds, data) => data.reduce<DomainBounds>(
        ({ minX, maxX, minY, maxY }, row) => ({
          minX: row[0] < minX ? row[0] : minX,
          maxX: row[0] > maxX ? row[0] : maxX,
          minY: row[1] < minY ? row[1] : minY,
          maxY: row[1] > maxY ? row[1] : maxY,
        }),
        bounds,
      ),
      {
        minX: Number.MAX_SAFE_INTEGER,
        maxX: 0,
        minY: Number.MAX_SAFE_INTEGER,
        maxY: 0,
      },
    );

    this.xScale = d3
      .scaleLinear()
      .domain([ minX, maxX ])
      .range([ 0, this.layout.boundedWidth ]);

    this.yScale = d3
      .scaleLinear()
      .domain([ minY, maxY ])
      .range([ this.layout.boundedHeight, 0 ]);
  }

  plot() {
    // 1. plot values
    const lineGenerator = d3
      .line()
      .x(d => this.xScale(d[0]))
      .y(d => this.yScale(d[1]))
      .curve(d3.curveBasis);

    for (let i = 0; i < this.dataSeries.length; i += 1) {
      this.bounds
        .append('path')
        .attr('d', lineGenerator((this.dataSeries[i])))
        .attr('fill', 'none')
        .attr('stroke', LineChart.COLORS[i])
        .attr('stroke-width', 2);
    }

    // 2. plot axes
    const yAxisGenerator = d3.axisLeft(this.yScale);
    const yAxis = this.bounds.append('g').call(yAxisGenerator);

    this.wrapper.append('text')
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .attr('y', this.layout.margin.left - 30)
      .attr('x', -this.layout.boundedHeight / 2)
      .attr('transform', 'rotate(-90)')
      .text('Minutes');

    const xAxisGenerator = d3.axisBottom(this.xScale).tickFormat(val => `${val.valueOf() / 1000}K`);
    const xAxis = this.bounds
      .append('g')
      .call(xAxisGenerator)
      .style('transform', `translateY(${this.layout.boundedHeight}px)`);

    this.wrapper.append('text')
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .attr('x', this.layout.width / 2)
      .attr('y', this.layout.height - 6)
      .text('Scraped URLs');

    // 3. plot grid lines
    this.bounds.append('g')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.05)
      .attr('transform', `translate(0,${this.layout.boundedHeight})`)
      .call(
        d3.axisBottom(this.xScale).ticks(5)
          .tickSize(-this.layout.boundedHeight)
          .tickFormat(() => ''),
      );
    this.bounds.append('g')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.05)
      .call(
        d3.axisLeft(this.yScale).ticks(10)
          .tickSize(-this.layout.boundedWidth)
          .tickFormat(() => ''),
      );

    // 4. plot legend
    if (this.legend.length > 1) {
      const legendWrapper = this.wrapper.append('g')
        .style(
          'transform',
          'translate(0px,10px)',
        );

      let xPos = this.layout.margin.left + this.layout.boundedWidth / 2;

      legendWrapper.append('text').attr('text-anchor', 'end')
        .attr('x', this.layout.margin.left + this.layout.boundedWidth / 2)
        .attr('y', 15 / 2)
        .attr('dy', '0.35em')
        .attr('class', 'legend')
        .text('Number of scraper instances:');

      xPos += 10;

      for (let i = 0; i < this.legend.length; i += 1) {
        legendWrapper.append('rect')
          .attr('x', xPos)
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', LineChart.COLORS[i]);

        xPos += 20;

        legendWrapper.append('text').attr('text-anchor', 'start')
          .attr('x', xPos)
          .attr('y', 15 / 2)
          .attr('dy', '0.35em')
          .attr('class', 'legend')
          .text(this.legend[i]);

        xPos += 30;
      }
    }
  }

  save(filepath: string) {
    fs.writeFileSync(filepath, this.wrapper.node().outerHTML);
  }
}
