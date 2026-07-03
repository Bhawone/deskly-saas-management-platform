const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, 'app'), (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace Tailwind colors for the new Emerald/Teal/Cyan palette
    let newContent = content
      .replace(/indigo/g, 'emerald')
      .replace(/violet/g, 'teal')
      .replace(/purple/g, 'cyan');
      
    // Replace green badge with amber so it doesn't clash with the new emerald primary
    // But only where we use green-500/20, green-300, etc.
    newContent = newContent
      .replace(/green-500/g, 'amber-500')
      .replace(/green-300/g, 'amber-300')
      .replace(/green-400/g, 'amber-400')
      .replace(/text-green-800/g, 'text-emerald-800') // for ticket status
      .replace(/bg-green-100/g, 'bg-emerald-100')
      .replace(/dark:text-green-300/g, 'dark:text-emerald-300')
      .replace(/dark:bg-green-900\/40/g, 'dark:bg-emerald-900/40');
      
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
