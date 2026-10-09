const fs = require('fs');
const path = 'backend/src/controllers/analyticsController.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /const newJoiners = await Employee\.countDocuments\(\{\s*\.\.\.empFilter,\s*joiningDate: \{ \$gte: monthStart \}\s*\}\);/g;
const replacement = `const newJoiners = await Employee.countDocuments({
      ...empFilter,
      joiningDate: { $gte: monthStart }
    });
    
    const date7D = new Date(today);
    date7D.setDate(date7D.getDate() - 7);
    const newJoiners7D = await Employee.countDocuments({
      ...empFilter,
      joiningDate: { $gte: date7D }
    });
    
    const date30D = new Date(today);
    date30D.setDate(date30D.getDate() - 30);
    const newJoiners30D = await Employee.countDocuments({
      ...empFilter,
      joiningDate: { $gte: date30D }
    });`;

if (!content.includes('const newJoiners7D')) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed analyticsController');
} else {
  console.log('Already fixed');
}
