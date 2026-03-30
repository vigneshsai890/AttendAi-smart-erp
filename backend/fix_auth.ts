import fs from 'fs';
import path from 'path';

const authFilePath = '/Users/work/AttendAi-smart-erp/src/lib/auth.ts';
let content = fs.readFileSync(authFilePath, 'utf8');

// Replace the authorize function with a more descriptive one that logs everything
content = content.replace(
  /async authorize\(credentials\) \{([\s\S]+?)\},/g,
  `async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        try {
          const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
          console.log("[AUTH] Attempting login for:", credentials.email);
          console.log("[AUTH] Using backendUrl:", backendUrl);

          const endpoint = credentials.totp ? "/api/auth/verify-otp" : "/api/auth/login";
          const payload = credentials.totp
            ? { email: credentials.email, otp: credentials.totp }
            : { email: credentials.email, password: credentials.password };

          console.log("[AUTH] Endpoint:", endpoint);

          const res = await axios.post(\`\${backendUrl}\${endpoint}\`, payload, {
            timeout: 5000 // 5 second timeout
          });
          
          console.log("[AUTH] Backend response status:", res.status);
          const user = res.data;

          if (user.requiresOTP) {
            console.log("[AUTH] OTP_REQUIRED detected");
            throw new Error("OTP_REQUIRED");
          }

          console.log("[AUTH] Login successful for:", user.email);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error: any) {
          console.error("[AUTH] Error in authorize:", error.message);
          if (error.response) {
            console.error("[AUTH] Error response status:", error.response.status);
            console.error("[AUTH] Error response data:", error.response.data);
          }
          
          if (error.message === "OTP_REQUIRED") throw error;
          
          const msg = error.response?.data?.error || error.message || "Invalid credentials";
          throw new Error(msg);
        }
      },`
);

fs.writeFileSync(authFilePath, content);
console.log('Successfully updated src/lib/auth.ts');
