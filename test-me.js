const http = require('http');

const req = http.request('http://localhost:3000/api/auth/me', {
  headers: {
    'Authorization': 'Bearer fake'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Data:', data));
});
req.on('error', console.error);
req.end();
