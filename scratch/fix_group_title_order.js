import fs from 'fs';

let css = fs.readFileSync('D:/st-philopateer/eftekad/front/src/index.css', 'utf8');

// Remove all previous .sidebar-group-title blocks to prevent rule conflicts
css = css.replace(/\/\* --- SIDEBAR GROUP TITLE STYLING --- \*\/[\s\S]*/gi, '');

const finalGroupTitleBlock = `
/* --- ABSOLUTE FINAL SIDEBAR GROUP TITLE OVERRIDES --- */
.sidebar-group-title {
  font-size: 0.8rem !important;
  font-weight: 700 !important;
  color: rgba(255, 255, 255, 0.75) !important;
  padding: 14px 20px 4px 20px !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  list-style: none !important;
  white-space: nowrap;
}

#sidebar.collapsed .sidebar-group-title {
  font-size: 0 !important;
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  height: 0 !important;
  width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

#sidebar.collapsed:hover .sidebar-group-title {
  font-size: 0.8rem !important;
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
  height: auto !important;
  width: auto !important;
  padding: 14px 20px 4px 20px !important;
}
`;

css += finalGroupTitleBlock;
fs.writeFileSync('D:/st-philopateer/eftekad/front/src/index.css', css, 'utf8');
console.log('✅ Placed absolute final group title overrides at the end of index.css');
