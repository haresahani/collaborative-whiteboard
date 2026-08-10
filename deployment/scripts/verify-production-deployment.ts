import http from 'http';
import https from 'https';
import { io } from 'socket.io-client';

interface VerificationConfig {
  baseUrl: string;
  socketUrl: string;
  dryRun: boolean;
}

const config: VerificationConfig = {
  baseUrl: process.env.VERIFY_BASE_URL || 'http://localhost:1234',
  socketUrl: process.env.VERIFY_SOCKET_URL || 'http://localhost:3001',
  dryRun: process.argv.includes('--dry-run'),
};

async function verifyHttpEndpoint(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`[Verify] Testing HTTP endpoint: ${url}`);
    if (config.dryRun) {
      console.log(`[Verify] Dry-run enabled: skipping real network call to ${url}`);
      return resolve(true);
    }

    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      console.log(`[Verify] Response status for ${url}: ${res.statusCode}`);
      resolve(res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302);
    });

    req.on('error', (err) => {
      console.error(`[Verify] HTTP request failed for ${url}:`, err.message);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.error(`[Verify] HTTP request timed out for ${url}`);
      resolve(false);
    });
  });
}

async function verifyWebSocketConnection(socketUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`[Verify] Testing Socket.IO handshake at: ${socketUrl}`);
    if (config.dryRun) {
      console.log(`[Verify] Dry-run enabled: skipping real socket handshake to ${socketUrl}`);
      return resolve(true);
    }

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    socket.on('connect', () => {
      console.log(`[Verify] Socket.IO connected successfully with ID: ${socket.id}`);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (err) => {
      console.error(`[Verify] Socket.IO connection error:`, err.message);
      socket.disconnect();
      resolve(false);
    });
  });
}

async function runVerification() {
  console.log('=== [Production Deployment Verification] Starting Checks ===');
  
  const httpOk = await verifyHttpEndpoint(`${config.baseUrl}/api/health`);
  const socketOk = await verifyWebSocketConnection(config.socketUrl);

  console.log('\n=== Verification Summary ===');
  console.log(`API Health Endpoint : ${httpOk ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`WebSocket Handshake : ${socketOk ? '✅ PASSED' : '❌ FAILED'}`);

  if (httpOk && socketOk) {
    console.log('\n🚀 Production Deployment Verification Completed Successfully!');
    process.exit(0);
  } else {
    console.error('\n⚠️ Production Deployment Verification Failed.');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Unhandled error during verification:', err);
  process.exit(1);
});
