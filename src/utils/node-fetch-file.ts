import fs from 'fs';
import path from 'path';
import nodeFetch, { Request, Response } from 'node-fetch';

export default function (url, options):Promise<Response> {
  const request = new Request(url, options);
  if (request.url.substring(0, 5) === 'file:') {
    return new Promise((resolve, reject) => {
      const filePath = path.normalize(url.substring('file://'.length));
      if (!fs.existsSync(filePath)) {
        reject(new Error(`File not found: ${filePath}`));
      }
      const readStream = fs.createReadStream(filePath);
      readStream.on('open', () => {
        resolve(new Response(readStream, {
        //   url: request.url,
          status: 200,
          statusText: 'OK',
        //   size: fs.statSync(filePath).size,
        //   timeout: request.timeout,
        }));
      });
    });
  }
  return nodeFetch(url, options);
}
