const fs = require('fs');
let content = fs.readFileSync('backend/src/controllers/authController.js', 'utf8');
content = content.replace(/\\`\\\$\\{process\.env\.FRONTEND_URL \|\| 'http:\/\/localhost:5173'\\}\/reset-password\/\\\$\\{rawToken\\}\\`/g, "`${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${rawToken}`");
fs.writeFileSync('backend/src/controllers/authController.js', content);
console.log("Fixed!");
