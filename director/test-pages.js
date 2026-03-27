const http = require('http');
const routes = [
  '/', '/dashboard', '/create/intent', '/create/brief',
  '/create/character-setup', '/create/style-dna', '/create/generating',
  '/create/review', '/create/export', '/projects', '/characters', '/settings'
];
let done = 0;
routes.forEach(route => {
  const req = http.get(`http://localhost:3000${route}`, { timeout: 10000 }, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      const status = res.statusCode === 200 ? 'OK' : 'FAIL';
      const errMatch = body.match(/Error:?\s*([^\n<]{0,120})/);
      const errMsg = res.statusCode !== 200 && errMatch ? ` | ${errMatch[1]}` : '';
      console.log(`${status} ${res.statusCode} ${route}${errMsg}`);
      done++;
      if (done === routes.length) console.log(`\nDone: ${done} routes tested`);
    });
  });
  req.on('error', e => {
    console.log(`ERR  --- ${route} | ${e.message}`);
    done++;
    if (done === routes.length) console.log(`\nDone: ${done} routes tested`);
  });
});
