/* eslint-disable no-plusplus */
import { NodeFetchPlugin, Resource, SchemaType } from '@get-set-fetch/scraper';

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
        tlsCheck: {
          type: 'boolean',
          default: true,
          description: 'Check server certificate, certificate and hostname match',
        },
        connectTimeout: {
          type: 'number',
          default: 10 * 1000,
        },
        readTimeout: {
          type: 'number',
          default: 20 * 1000,
        },
        dnsResolution: {
          type: 'string',
          default: 'lookup',
          title: 'DNS Resolution',
          description: 'Use "lookup" to take into account local configuration files like /etc/hosts. Use "resolve" to always perform dns queries over the network.',
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

    /*
    every {bulkSize}th link contains bulkSize new links
    a value of 50 simulates scraping results pages with 50 entries per page
    */
    const bulkSize = 50;

    const links:string[] = [];
    if (resourceNo < this.opts.maxResources && (resourceNo === 1 || resourceNo % bulkSize === 0)) {
      // 1st insert should take into account the initial link-1 link
      const toAddNo = resourceNo === 1 ? bulkSize - 1 : bulkSize;
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
