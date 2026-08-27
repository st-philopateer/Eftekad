import fs from 'fs';

const code = fs.readFileSync('D:/st-philopateer/eftekad/back/server.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('static') || l.includes('dist') || l.includes('front') || l.includes('app.use') || l.includes('sendFile')) {
    console.log((i+1) + ': ' + l.trim());
  }
});
