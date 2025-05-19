// This script patches any requires of bcrypt to use bcryptjs instead
// Run this with: node bcrypt-patch.js

const fs = require('fs');
const path = require('path');

// Files that may use bcrypt
const filesToPatch = [
  path.join(__dirname, 'models', 'UserRepo.js'),
  path.join(__dirname, 'routes', 'authRoutes.js'),
  path.join(__dirname, 'controllers', 'authController.js'),
  path.join(__dirname, 'middlewares', 'auth.js')
];

// Process each file
filesToPatch.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`Checking file: ${file}`);
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace any bcrypt requires with bcryptjs
    const originalContent = content;
    content = content.replace(/require\(['"]bcrypt['"]\)/g, "require('bcryptjs')");
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      console.log(`Patched: ${file}`);
    } else {
      console.log(`No changes needed: ${file}`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('Patching complete!'); 