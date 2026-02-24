import { readFileSync } from 'fs';

const content = readFileSync('../app/page.tsx', 'utf8');
const lines = content.split('\n');

let braces = 0;
let parens = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Skip string contents roughly
  let inString = false;
  let stringChar = '';
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    const prev = j > 0 ? line[j-1] : '';
    
    if (!inString && (ch === '"' || ch === "'" || ch === '`')) {
      inString = true;
      stringChar = ch;
    } else if (inString && ch === stringChar && prev !== '\\') {
      inString = false;
    } else if (!inString) {
      if (ch === '{') braces++;
      if (ch === '}') braces--;
      if (ch === '(') parens++;
      if (ch === ')') parens--;
    }
  }
  
  // Log when we're near the problem area
  if (i >= 2025 && i <= 2040) {
    console.log(`Line ${i+1}: braces=${braces} parens=${parens} | ${line.trim().substring(0, 80)}`);
  }
}

console.log(`\nFinal: braces=${braces} parens=${parens}`);
console.log(`Total lines: ${lines.length}`);
