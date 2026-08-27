import fs from 'fs';
import path from 'path';

const files = [
  'auth-login.css',
  'priest-dashboard.css',
  'servant-dashboard.css'
];

files.forEach(f => {
  const rootFile = path.join('D:/st-philopateer/eftekad/front', f);
  const publicFile = path.join('D:/st-philopateer/eftekad/front/public', f);

  if (fs.existsSync(rootFile)) {
    const content = fs.readFileSync(rootFile, 'utf8');
    fs.writeFileSync(publicFile, content, 'utf8');
    console.log(`✅ Synced ${f} from front/ to front/public/`);
  }
});
