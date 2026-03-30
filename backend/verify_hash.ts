import bcrypt from 'bcryptjs';

const hash = 'b/bin/zshWi85c1UmjgH7ncjvYff.OSYlW8SXaMq5lsfTxlq0i3y5eZyb1OHe';
const password = 'faculty123';

async function verify() {
  const match = await bcrypt.compare(password, hash);
  console.log('Match:', match);
}

verify();
