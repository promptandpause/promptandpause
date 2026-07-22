const fs = require('fs');
const path = 'lib/services/circleService.ts';
const content = fs.readFileSync(path, 'utf8');
console.log('Current content length:', content.length);
console.log('First 50 chars:', JSON.stringify(content.slice(0, 50)));
