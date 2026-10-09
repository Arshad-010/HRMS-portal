const fs = require('fs');
let content = fs.readFileSync('backend/src/controllers/authController.js', 'utf8');
const searchString = "const resetUrl = \\`\\${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/\\${rawToken}\\`;";
const replaceString = "const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;";
content = content.replace(searchString, replaceString);
fs.writeFileSync('backend/src/controllers/authController.js', content);
console.log("Fixed!");
