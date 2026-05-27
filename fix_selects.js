const fs = require('fs');
const file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix select padding
content = content.replace(/<select\s+([^>]*?)className="([^"]*)"/g, (match, attrs, className) => {
  if (!className.includes('pr-8')) {
    return `<select ${attrs}className="${className} pr-8"`;
  }
  return match;
});

// Fix swap descending and ascending position
// For Sort Orders, the first option should be 'asc' and the second 'desc'
// Right now they might be:
// <option value="desc">Descending</option>
// <option value="asc">Ascending</option>
// Wait, the code has:
// <option value="desc">Newest First</option> or similar?
// Let's check what the code has for options.

fs.writeFileSync(file, content);
console.log('Fixed padding');
