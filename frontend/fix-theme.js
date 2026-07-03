const fs = require('fs');
const path = require('path');

const files = [
  'app/(admin)/layout.tsx',
  'app/(admin)/dashboard/page.tsx',
  'app/(admin)/tickets/page.tsx',
  'app/(admin)/users/page.tsx'
];

const replacements = [
  { search: /bg-\[\#0a0a0f\]/g, replace: 'bg-background' },
  { search: /bg-\[\#0d0d14\](\/50)?/g, replace: 'bg-card' },
  { search: /bg-\[\#13131f\]/g, replace: 'bg-card' },
  
  { search: /text-white\/([7-9]0|55|60)/g, replace: 'text-muted-foreground' },
  { search: /text-white\/([2-5]0|25|35|40)/g, replace: 'text-muted-foreground' },
  { search: /text-white/g, replace: 'text-foreground' },
  
  { search: /border-white\/(5|10)/g, replace: 'border' },
  { search: /border-t-white/g, replace: 'border-t-foreground' },
  
  { search: /bg-white\/\[0\.0[2-4]\]/g, replace: 'bg-card' },
  { search: /bg-white\/\[0\.0[5-9]\]/g, replace: 'bg-accent' },
  
  { search: /hover:bg-white\/\[0\.0[3-7]\]/g, replace: 'hover:bg-accent' },
  
  { search: /bg-white\/(5|10)/g, replace: 'bg-muted' },
  { search: /hover:bg-white\/(5|10)/g, replace: 'hover:bg-accent' },
  { search: /focus:bg-white\/(5|10)/g, replace: 'focus:bg-accent' },
  
  { search: /hover:text-white/g, replace: 'hover:text-foreground' },
  { search: /hover:border-indigo-500\/30/g, replace: 'hover:border-indigo-500' },
  
  // Custom classes like gradient-text could be left alone as they might be defined globally
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    replacements.forEach(({ search, replace }) => {
      content = content.replace(search, replace);
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
