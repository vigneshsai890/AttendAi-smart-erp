import axios from 'axios';

async function debugEndpoint(url: string) {
  console.log(`\n🔍 Debugging: ${url}`);
  try {
    const res = await axios.get(url, {
      validateStatus: () => true,
      headers: {
        'Origin': 'https://attendai-smart-erp.onrender.com',
        'x-sniff': 'true' // Trigger the new sniffer if live
      }
    });

    const isNewVersion = res.data && (res.data.deploy || res.data.hub);
    const statusColor = res.status === 200 ? "✅" : (res.status === 401 ? "🔐" : "❌");

    console.log(`${statusColor} Status: ${res.status} ${res.statusText}`);
    if (isNewVersion) console.log(`🚀 NEW VERSION DETECTED! [${res.data.deploy || res.data.hub}]`);
    if (res.data.env) console.log(`🌍 Env Diagnostics:`, JSON.stringify(res.data.env, null, 2));

    console.log(`Headers:`, res.headers);
    console.log(`Body:`, typeof res.data === 'object' ? JSON.stringify(res.data, null, 2).slice(0, 1000) : res.data.slice(0, 500));
  } catch (err: any) {
    console.error(`🚨 Error: ${err.message}`);
  }
}

async function run() {
  console.log("🛠️  Industry-Grade Production Debugger v3.0");
  await debugEndpoint('https://attendai-backend-ynnd.onrender.com/api/health');
  await debugEndpoint('https://attendai-backend-ynnd.onrender.com/auth/ping');
  await debugEndpoint('https://attendai-smart-erp.onrender.com/auth/ping');
  await debugEndpoint('https://attendai-backend-ynnd.onrender.com/auth/session');
  await debugEndpoint('https://attendai-smart-erp.onrender.com/auth/session');
}

run();
