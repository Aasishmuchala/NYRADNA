const http = require('http');
http.get('http://localhost:3000/create/brief', r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    if (r.statusCode === 500) {
      const match = d.match(/Error[^<]*/);
      console.log('Brief error:', match ? match[0] : d.substring(0, 500));
    }
  });
});
