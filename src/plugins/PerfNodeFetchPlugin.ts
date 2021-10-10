/* eslint-disable no-plusplus */
import { NodeFetchPlugin, Resource } from '@get-set-fetch/scraper';
import { SchemaType } from '@get-set-fetch/scraper/dist/cjs/schema/SchemaHelper';

export default class PerfNodeFetchPlugin extends NodeFetchPlugin {
  static get schema() {
    return {
      type: 'object',
      title: 'Node Fetch Plugin',
      description: 'fetch resources via nodejs https/http',
      properties: {
        headers: {
          type: 'object',
          additionalProperties: {
            type: 'string',
          },
          default: {
            'Accept-Encoding': 'br,gzip,deflate',
          },
        },
        rejectUnauthorized: {
          type: 'boolean',
          default: true,
        },
        maxResources: {
          type: 'integer',
          default: 100,
          title: 'Max Resources',
          description: 'Maximum number of resources to be mocked.',
        },
      },
    } as const;
  }

  opts: SchemaType<typeof PerfNodeFetchPlugin.schema>;

  constructor(opts: SchemaType<typeof PerfNodeFetchPlugin.schema> = {}) {
    super(opts);
  }

  async fetch(resource: Resource): Promise<Partial<Resource>> {
    // "https://www.mock-domain.org/link-".length -> 33
    const resourceNo:number = parseInt(resource.url.substring(33, resource.url.length - 5), 10);

    // every 10th link contains 10 new links
    const links:string[] = [];
    if (resourceNo < this.opts.maxResources && (resourceNo === 1 || resourceNo % 10 === 0)) {
      // 1st insert should take into account the initial link-1 link
      const toAddNo = resourceNo === 1 ? 9 : 10;
      for (let i = 1; i <= toAddNo; i += 1) {
        const linkNo = resourceNo + i;
        links.push(`<a href="link-${linkNo}.html">resource ${linkNo}</a>`);
      }
    }

    return {
      data: Buffer.from(`
              <html>
                  <body>
                      <h1>Header ${resourceNo}</h1>
                      ${links.join('\n')}
                  </body>
              </html>
            `),
      contentType: 'text/html',
      status: 200,
    };
  }
}
