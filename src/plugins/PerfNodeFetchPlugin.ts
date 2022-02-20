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
        bulkSize: {
          type: 'integer',
          default: 50,
          title: 'Bulk Size',
          description: 'Every {bulkSize}th link contains bulkSize new links, simulating scraping results pages with multiple entries per result page',
        },
      },
    } as const;
  }

  opts: SchemaType<typeof PerfNodeFetchPlugin.schema>;

  constructor(opts: SchemaType<typeof PerfNodeFetchPlugin.schema> = {}) {
    super(opts);
  }

  async fetch(resource: Resource): Promise<Partial<Resource>> {
    // ex: "https://www.mock-domain.org/link-10.html"
    const resourceNoMatch = resource.url.match(/\d+/);
    const resourceNo:number = resourceNoMatch ? parseInt(resourceNoMatch[0], 10) : 0;

    const { bulkSize } = this.opts;
    const links:string[] = [];

    if (bulkSize > 0) {
      if (resourceNo < this.opts.maxResources && (resourceNo === 1 || resourceNo % bulkSize === 0)) {
      // 1st insert should take into account the initial link-1 link
        const toAddNo = resourceNo === 1 ? bulkSize - 1 : bulkSize;
        for (let i = 1; i <= toAddNo; i += 1) {
          const linkNo = resourceNo + i;
          links.push(`<a href="link-${linkNo}.html">resource ${linkNo}</a>`);
        }
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
