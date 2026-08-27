import fs from 'fs';
import path from 'path';

const files = ['priest-dashboard.css', 'servant-dashboard.css'];

files.forEach(f => {
  ['front', 'front/public'].forEach(folder => {
    const p = path.join('D:/st-philopateer/eftekad', folder, f);
    if (fs.existsSync(p)) {
      let css = fs.readFileSync(p, 'utf8');

      // Remove hardcoded #sidebar width and min-width overrides in static CSS
      css = css.replace(/#sidebar\s*\{[\s\S]*?min-width:[\s\S]*?\}/gi, '/* #sidebar width handled by index.css */');
      css = css.replace(/#sidebar\.collapsed\s*\{[\s\S]*?\}/gi, '/* #sidebar.collapsed handled by index.css */');

      fs.writeFileSync(p, css, 'utf8');
      console.log(`✅ Cleaned ${f} in ${folder}/`);
    }
  });
});
