import bcrypt from 'bcryptjs';
const hash = '$2b$10$3960U0A6wv9TRqMMm4q4ieliP3Z0OT.kxDdkTr6QXjOR8fcrzcvvi';
const password = 'faculty123';
async function verify() {
  const match = await bcrypt.compare(password, hash);
  console.log('Match (faculty123):', match);
}
verify();
