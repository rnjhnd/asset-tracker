const fs = require('fs'); 
const content = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8'); 
const lines = content.split('\n'); 
lines.forEach((l, i) => { 
  if(l.includes('<input ') && l.includes('value={newAsset.')) {
    console.log(i+1 + ': ' + l.trim()); 
  }
  if(l.includes('<input ') && l.includes('value={newCategoryName}')) {
    console.log(i+1 + ': ' + l.trim()); 
  }
  if(l.includes('<input ') && l.includes('value={newUser.')) {
    console.log(i+1 + ': ' + l.trim()); 
  }
});
