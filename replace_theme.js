const fs = require('fs');

const files = [
  'd:/examtest--main/examtest--main/frontend/src/pages/MyCourses.jsx',
  'd:/examtest--main/examtest--main/frontend/src/pages/Login.jsx',
  'd:/examtest--main/examtest--main/frontend/src/pages/Dashboard.jsx',
  'd:/examtest--main/examtest--main/frontend/src/pages/ActiveExam.jsx',
  'd:/examtest--main/examtest--main/frontend/src/pages/ScoreCard.jsx',
  'd:/examtest--main/examtest--main/frontend/src/pages/StudyGrowth.jsx',
  'd:/examtest--main/examtest--main/frontend/src/pages/MockTestSelection.jsx',
  'd:/examtest--main/examtest--main/frontend/src/pages/admin/AdminLayout.jsx',
  'd:/examtest--main/examtest--main/frontend/src/pages/admin/AdminCourses.jsx',
  'd:/examtest--main/examtest--main/frontend/src/pages/admin/AdminTests.jsx',
  'd:/examtest--main/examtest--main/frontend/src/pages/admin/AdminResourcesModal.jsx',
  'd:/examtest--main/examtest--main/frontend/src/pages/admin/AdminDashboard.jsx',
  'd:/examtest--main/examtest--main/frontend/src/pages/admin/AdminUsers.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replacements
  content = content.replace(/text-white/g, 'text-gray-900');
  content = content.replace(/text-gray-400/g, 'text-gray-600');
  content = content.replace(/text-gray-300/g, 'text-gray-700');
  content = content.replace(/text-gray-500/g, 'text-gray-500');
  content = content.replace(/bg-white\/5/g, 'bg-[#FFF2D0]');
  content = content.replace(/bg-white\/10/g, 'bg-[#FFB2B2]/20');
  content = content.replace(/border-white\/10/g, 'border-[#E36A6A]/20');
  content = content.replace(/border-white\/5/g, 'border-[#E36A6A]/10');
  content = content.replace(/text-teal/g, 'text-[#E36A6A]');
  content = content.replace(/bg-teal/g, 'bg-[#E36A6A]');
  content = content.replace(/bg-teal\/10/g, 'bg-[#E36A6A]/10');
  content = content.replace(/border-teal\/20/g, 'border-[#E36A6A]/20');
  content = content.replace(/text-navy/g, 'text-white');
  content = content.replace(/bg-\[\#0E203B\]/g, 'bg-[#FFFBF1]');
  content = content.replace(/bg-black/g, 'bg-gray-900/50');
  content = content.replace(/bg-navy/g, 'bg-[#FFFBF1]');
  content = content.replace(/from-navy/g, 'from-[#FFFBF1]');
  content = content.replace(/via-navy/g, 'via-[#FFF2D0]');
  content = content.replace(/to-teal\/10/g, 'to-[#FFB2B2]/20');
  content = content.replace(/shadow-teal\/10/g, 'shadow-[#E36A6A]/20');
  
  // Specific Admin Styles
  content = content.replace(/#0E1F38/g, '#FFFBF1');
  content = content.replace(/#64FFDA/g, '#E36A6A');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0.02\)/g, 'rgba(0,0,0,0.02)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0.03\)/g, 'rgba(0,0,0,0.03)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0.05\)/g, 'rgba(0,0,0,0.05)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0.1\)/g, 'rgba(0,0,0,0.1)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0.2\)/g, 'rgba(0,0,0,0.2)');
  content = content.replace(/color:\s*'#fff'/g, "color: '#333'");
  content = content.replace(/color:\s*"#fff"/g, 'color: "#333"');
  content = content.replace(/color:\s*'#CBD5E1'/g, "color: '#555'");
  content = content.replace(/color:\s*"#CBD5E1"/g, 'color: "#555"');
  content = content.replace(/color:\s*'#94A3B8'/g, "color: '#666'");

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
});
