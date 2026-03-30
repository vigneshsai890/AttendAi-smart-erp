import bcrypt from 'bcryptjs';
import fs from 'fs';

const users = JSON.parse(fs.readFileSync('dumped_after_seed.json', 'utf8'));

async function verifyAll() {
  const credentials = [
    { email: 'admin@apollo.edu', password: 'admin123' },
    { email: 'vignesh@apollo.edu', password: 'faculty123' },
    { email: 'vignesh.s@apollo.edu', password: 'student123' }
  ];

  for (const cred of credentials) {
    const user = users.find((u: any) => u.email === cred.email);
    if (!user) {
      console.log(`User ${cred.email} not found in dump`);
      continue;
    }
    const match = await bcrypt.compare(cred.password, user.passwordHash);
    console.log(`Match for ${cred.email}: ${match}`);
  }
}

verifyAll();
