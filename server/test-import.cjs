const http = require('http');
const fs = require('fs');

const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
const fileContent = fs.readFileSync('C:/Users/monta/Downloads/febrero.xlsx');
const fileName = 'febrero.xlsx';

const header = '--' + boundary + '\r\n' +
  'Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n' +
  'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n';

const footer = '\r\n--' + boundary + '--';

const body = Buffer.concat([
  Buffer.from(header),
  fileContent,
  Buffer.from(footer)
]);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/equipment/import',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': body.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => console.log('Error:', e.message));
req.write(body);
req.end();