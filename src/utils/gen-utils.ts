import fs from 'fs';

const urlsNo = 1e6;
const filePath = 'cloud/ansible/files/1000k_urls.csv';

const ws = fs.createWriteStream(filePath);
ws.on('error', err => {
  console.error(err);
});
ws.on('close', () => {
  console.log(`generated urls under ${filePath}`);
});

for (let i = 1; i <= urlsNo; i += 1) {
  ws.write(`https://www.mock-domain.org/link-${i}.html\n`);
}

ws.close();
