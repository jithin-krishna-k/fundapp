// Simple test to verify Logo.jsx syntax
const fs = require('fs');
const code = fs.readFileSync('D:\\fund\\src\\components\\fund\\Logo.jsx', 'utf8');
console.log('File read successfully, length:', code.length);
console.log('First 100 chars:', code.substring(0, 100));