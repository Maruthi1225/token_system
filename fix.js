const fs = require('fs');
const files = [
    'c:/Users/marut/Desktop/token_system/frontend/src/pages/Inpatients.jsx',
    'c:/Users/marut/Desktop/token_system/frontend/src/pages/InpatientDetails.jsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');
    fs.writeFileSync(file, content);
});
console.log('Fixed files');
