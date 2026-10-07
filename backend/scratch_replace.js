const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '..', 'frontend', 'src');

const replacements = {
  // Backgrounds
  'bg-slate-50': 'bg-page',
  'bg-slate-100': 'bg-secondary',
  'bg-white': 'bg-surface',
  
  // Text
  'text-slate-900': 'text-heading',
  'text-slate-800': 'text-main',
  'text-slate-700': 'text-secondary',
  'text-slate-600': 'text-secondary',
  'text-slate-500': 'text-muted',
  
  // Borders
  'border-slate-200': 'border-default',
  'border-slate-300': 'border-strong',
  'border-slate-100': 'border-default',

  // Primary (Indigo to Sage)
  'bg-indigo-600': 'bg-primary',
  'hover:bg-indigo-500': 'hover:bg-primary-hover',
  'bg-indigo-500': 'bg-primary',
  'text-indigo-600': 'text-primary',
  'text-indigo-500': 'text-primary',
  'border-indigo-500': 'border-primary',
  'bg-indigo-50': 'bg-primary-soft',
  'text-indigo-400': 'text-primary',
  
  // Buttons etc
  'bg-slate-900': 'bg-heading',
  'text-slate-400': 'text-muted',
};

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      // We only want to replace light mode classes!
      // Dark mode classes are prefixed with dark:
      // So we use regex to replace only when not preceded by dark:
      
      for (const [oldClass, newClass] of Object.entries(replacements)) {
        // Negative lookbehind for dark: and hover: (unless the key includes hover:)
        // We have to be careful with hover:bg-slate-100 etc.
      }
    }
  }
}
