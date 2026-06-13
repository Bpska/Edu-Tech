const fs = require('fs');

const adminCssPath = 'd:/examtest--main/examtest--main/frontend/src/pages/admin/admin.css';

if (fs.existsSync(adminCssPath)) {
  let content = fs.readFileSync(adminCssPath, 'utf8');

  // Replace background colors
  content = content.replace(/#060E1A/gi, '#FFFBF1');
  content = content.replace(/#080F1C/gi, '#FFF2D0');
  content = content.replace(/#0C1829/gi, '#FFFBF1');
  content = content.replace(/#0E1F38/gi, '#FFFBF1');

  // Replace text colors
  content = content.replace(/#CBD5E1/gi, '#555555');
  content = content.replace(/#fff/gi, '#333333');
  content = content.replace(/#FFFFFF/gi, '#333333');
  content = content.replace(/#94A3B8/gi, '#666666');
  content = content.replace(/#64748B/gi, '#777777');
  content = content.replace(/#475569/gi, '#555555');
  content = content.replace(/#334155/gi, '#666666');

  // Replace accents
  content = content.replace(/#64FFDA/gi, '#E36A6A'); // Teal to Coral
  content = content.replace(/100,\s*255,\s*218/g, '227,106,106'); // RGB Teal to Coral
  
  // Replace white overlays with black overlays
  content = content.replace(/rgba\(255,\s*255,\s*255,/g, 'rgba(0,0,0,');
  
  // Replace black overlays with white overlays if needed, but in light theme we want black overlays
  content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.15\)/g, 'rgba(255,242,208,0.5)'); // panel bg
  
  // Specific tweaks
  // Since we replaced #fff with #333, button text on coral should be white, let's fix btn-primary
  content = content.replace(/color:\s*#333333;\s*\/\*\s*was\s*#060E1A/gi, 'color: #FFFFFF;');
  
  fs.writeFileSync(adminCssPath, content, 'utf8');
  console.log('admin.css updated successfully.');
} else {
  console.log('admin.css not found.');
}
