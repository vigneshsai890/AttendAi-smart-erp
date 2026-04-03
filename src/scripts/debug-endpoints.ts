import axios from 'axios';

async function debugEndpoint(url: string) {
  console.log(`\n🔍 Debugging: ${url}`);
  try {
    const res = await axios.get(url, {
      validateStatus: () => true,
      headers: {
        'Origin': 'https://attendai-smart-erp.onrender.com'
      }
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Headers:`, res.headers);
    console.log(`Body:`, typeof res.data === 'object' ? JSON.stringify(res.data).slice(0, 500) : res.data.slice(0, 500));
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
  }
}

async function run() {
  await debugEndpoint('https://attendai-backend-ynnd.onrender.com/api/health');
  await debugEndpoint('https://attendai-backend-ynnd.onrender.com/api/debug/db-test');
  await debugEndpoint('https://attendai-backend-ynnd.onrender.com/api/auth/ping');
  await debugEndpoint('https://attendai-backend-ynnd.onrender.com/api/auth/session');
  await debugEndpoint('https://attendai-smart-erp.onrender.com/api/auth/session');
}

run();
