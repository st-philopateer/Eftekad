const fs = require('fs');
const vm = require('vm');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'front', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Regex to find script contents (ignoring external scripts)
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 1;
let hasErrors = false;

while ((match = scriptRegex.exec(html)) !== null) {
    const scriptContent = match[1].trim();
    if (scriptContent.length === 0) continue;
    
    try {
        new vm.Script(scriptContent, { filename: `index.html - Script #${scriptIndex}` });
        console.log(`Script #${scriptIndex} compiled successfully.`);
    } catch (e) {
        console.error(`Error in Script #${scriptIndex}:`, e.message);
        console.error(e.stack);
        hasErrors = true;
    }
    scriptIndex++;
}

if (!hasErrors) {
    console.log("All scripts compiled successfully!");
} else {
    process.exit(1);
}
