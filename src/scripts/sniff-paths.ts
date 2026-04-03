import axios from 'axios';

async function sniff(url: string) {
  try {
    const res = await axios.get(`${url}?sniff=true`, { validateStatus: () => true });
    console.log(`SNIFF ${url} -> ${res.status}`);
    if (res.status === 200) {
      console.log('Results:', JSON.stringify(res.data, null, 2));
    } else {
      console.log('No Sniff Response (Route not hit)');
    }
  } catch (err: any) {
    console.log(`SNIFF ${url} -> ERROR: ${err.message}`);
  }
}

async function run() {
  const backend = 'https://attendai-backend-ynnd.onrender.com';

  console.log('\n--- BACKEND SNIFFING ---');
  await sniff(`${backend}/auth/ping`);
  await sniff(`${backend}/api/auth/ping`);
  await sniff(`${backend}/api/health`);
}

run();
