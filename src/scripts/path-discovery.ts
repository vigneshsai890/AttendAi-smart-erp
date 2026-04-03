import axios from 'axios';

async function probe(url: string) {
  try {
    const res = await axios.get(url, { validateStatus: () => true });
    console.log(`PROBE ${url} -> ${res.status} ${res.statusText}`);
    if (res.status !== 404) console.log(`   Body: ${JSON.stringify(res.data).slice(0, 100)}`);
  } catch (err: any) {
    console.log(`PROBE ${url} -> ERROR: ${err.message}`);
  }
}

async function run() {
  const backend = 'https://attendai-backend-ynnd.onrender.com';
  const frontend = 'https://attendai-smart-erp.onrender.com';

  console.log('\n--- BACKEND PROBE ---');
  await probe(`${backend}/api/auth/ping`);
  await probe(`${backend}/auth/ping`);
  await probe(`${backend}/api/health`);

  console.log('\n--- FRONTEND PROBE ---');
  await probe(`${frontend}/api/auth/ping`);
  await probe(`${frontend}/auth/ping`);
  await probe(`${frontend}/api/auth/session`);
}

run();
