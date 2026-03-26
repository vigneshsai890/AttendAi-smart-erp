import { NextResponse } from "next/server";
import os from "os";

export async function GET() {
  const nets = os.networkInterfaces();
  let localIp = "localhost";
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Return the first external IPv4 address found
      if (net.family === "IPv4" && !net.internal) {
        localIp = net.address;
        break;
      }
    }
  }
  
  return NextResponse.json({ ip: localIp });
}
