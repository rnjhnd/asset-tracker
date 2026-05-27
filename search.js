const fs = require('fs'); 
const content = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8'); 
const lines = content.split('\n'); 
lines.forEach((l, i) => { 
  if(l.includes('value="desc"') || l.includes('value="asc"')) {
    console.log(i+1 + ': ' + l.trim()); 
  }
});
