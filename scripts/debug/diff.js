const fs = require('fs');
const login = fs.readFileSync('app/(admin_side)/login/page.tsx', 'utf8');
const verif = fs.readFileSync('app/(admin_side)/login/verification/page.tsx', 'utf8');

const getLeftPart = (code) => {
  const startStr = "{/* Left Side - Branding */}";
  const endStr = "{/* Right Side - Form */}";
  const startIndex = code.indexOf(startStr);
  const endIndex = code.indexOf(endStr);
  if (startIndex === -1 || endIndex === -1) return null;
  return code.substring(startIndex, endIndex);
};

console.log(getLeftPart(login) === getLeftPart(verif) ? "IDENTICAL" : "DIFFERENT");
