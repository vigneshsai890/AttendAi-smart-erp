import fs from 'fs';

// 1. Update src/lib/auth.ts to be more robust and log better
const authPath = '/Users/work/AttendAi-smart-erp/src/lib/auth.ts';
let authContent = fs.readFileSync(authPath, 'utf8');
authContent = authContent.replace(
  /throw new Error\("OTP_REQUIRED"\);/g,
  'console.log("[AUTH] THROWING OTP_REQUIRED"); throw new Error("OTP_REQUIRED");'
);
fs.writeFileSync(authPath, authContent);

// 2. Update src/app/login/page.tsx to handle potential wrapped errors
const loginPath = '/Users/work/AttendAi-smart-erp/src/app/login/page.tsx';
let loginContent = fs.readFileSync(loginPath, 'utf8');

// The line: if (res?.error === "OTP_REQUIRED")
// We'll change it to also check if the error contains "OTP_REQUIRED" or if it's wrapped
loginContent = loginContent.replace(
  /if \(res\?\.error === "OTP_REQUIRED"\)/g,
  'if (res?.error === "OTP_REQUIRED" || res?.error?.includes("OTP_REQUIRED"))'
);

// Also log the error to console for easier debugging by the user if it still fails
loginContent = loginContent.replace(
  /\} else if \(res\?\.error\) \{/g,
  '} else if (res?.error) {\n        console.log("[LOGIN] Signin error:", res.error);'
);

fs.writeFileSync(loginPath, loginContent);

console.log('Successfully updated auth.ts and page.tsx with robust error handling.');
