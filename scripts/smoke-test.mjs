/**
 * Smoke test — boots a fresh server instance, connects a fake player,
 * sends movement inputs for a few seconds, and checks for runtime crashes.
 *
 * Exit code 0 = passed, 1 = crashed (error details on stderr)
 *
 * Uses port 14799 (admin 14800) and a temp database to avoid interfering
 * with any running server instance.
 */

import { fork } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const PORT = 14799;
const ADMIN_PORT = 14800;
const SETTLE_MS = 5000; // how long to let the server tick with a player connected
const BOOT_DELAY_MS = 2000; // wait for server to start before connecting

const tempDbPath = path.join(PROJECT_ROOT, `smoke-test-${Date.now()}.db`);
const serverEntry = path.join(PROJECT_ROOT, 'server', 'dist', 'main.js');

let crashed = false;
let stderrOutput = '';
let child = null;

function cleanup(exitCode) {
  try { if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath); } catch {}
  if (child && !child.killed) {
    child.kill('SIGTERM');
    setTimeout(() => {
      if (child && !child.killed) child.kill('SIGKILL');
    }, 2000);
  }
  // Give the process a moment to clean up before exiting
  setTimeout(() => process.exit(exitCode), 500);
}

// ── 1. Fork server ──

console.log('[SmokeTest] Booting test server on port ' + PORT + '...');

child = fork(serverEntry, [], {
  cwd: PROJECT_ROOT,
  env: {
    ...process.env,
    PORT: String(PORT),
    ADMIN_PORT: String(ADMIN_PORT),
    DATABASE_PATH: tempDbPath,
    // Blank out keys that would cause side effects
    ANTHROPIC_API_KEY: '',
    GITHUB_TOKEN: '',
    GITHUB_REPO: '',
    IS_MAIN_SERVER: '',
    ADMIN_USERS: '',
    PATREON_ACCESS_TOKEN: '',
    REGISTRY_SECRET: '',
    SERVER_PASSWORD: '',
  },
  stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
});

child.stderr.on('data', (data) => {
  const text = data.toString();
  stderrOutput += text;
  if (/TypeError|ReferenceError|SyntaxError|RangeError|Cannot read properties/.test(text)) {
    console.error('[SmokeTest] CRASH DETECTED:');
    console.error(text.slice(0, 500));
    crashed = true;
  }
});

child.stdout.on('data', (data) => {
  const text = data.toString().trim();
  if (text) console.log('[SmokeTest:server] ' + text.slice(0, 200));
});

child.on('exit', (code) => {
  if (code !== 0 && code !== null && !crashed) {
    console.error('[SmokeTest] Server exited with code ' + code);
    crashed = true;
    stderrOutput = stderrOutput || 'Server exited with code ' + code;
  }
});

child.on('error', (err) => {
  console.error('[SmokeTest] Failed to start server: ' + err.message);
  crashed = true;
  stderrOutput = err.message;
});

// Hard timeout — if nothing happens in 15s, something is wrong
const hardTimeout = setTimeout(() => {
  if (!crashed) {
    console.log('[SmokeTest] PASSED (timeout reached without crash)');
    cleanup(0);
  } else {
    cleanup(1);
  }
}, 15000);

// ── 2. Wait for boot, then connect ──

await new Promise(r => setTimeout(r, BOOT_DELAY_MS));

if (crashed) {
  console.error('[SmokeTest] FAILED — server crashed on boot');
  console.error(stderrOutput.slice(0, 500));
  clearTimeout(hardTimeout);
  cleanup(1);
} else {
  console.log('[SmokeTest] Connecting fake player...');

  const ws = new WebSocket('ws://127.0.0.1:' + PORT);

  ws.on('error', (err) => {
    if (!crashed) {
      console.error('[SmokeTest] WebSocket error: ' + err.message);
      crashed = true;
      stderrOutput = 'WebSocket connection failed: ' + err.message;
      clearTimeout(hardTimeout);
      cleanup(1);
    }
  });

  ws.on('open', () => {
    console.log('[SmokeTest] Connected — sending join...');
    ws.send(JSON.stringify({
      type: 'join',
      token: 'smoke-test-' + Date.now(),
      username: 'SmokeBot',
      colors: { skin: '#c8a882', shirt: '#4a90d9', pants: '#2c5282' },
    }));

    // Send movement inputs to exercise the full game loop
    let seq = 0;
    const directions = [
      { dx: 1, dy: 0 },
      { dx: 1, dy: 1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: -1 },
    ];

    const moveInterval = setInterval(() => {
      if (crashed) {
        clearInterval(moveInterval);
        return;
      }
      const dir = directions[seq % directions.length];
      ws.send(JSON.stringify({
        type: 'input',
        seq: ++seq,
        dx: dir.dx,
        dy: dir.dy,
        autorun: false,
        facing: Math.atan2(dir.dy, dir.dx),
      }));
    }, 200);

    // After SETTLE_MS, declare result
    setTimeout(() => {
      clearInterval(moveInterval);
      clearTimeout(hardTimeout);
      ws.close();

      if (crashed) {
        console.error('\n[SmokeTest] FAILED — runtime crash detected');
        console.error(stderrOutput.slice(0, 500));
        cleanup(1);
      } else {
        console.log('\n[SmokeTest] PASSED — server survived ' + (SETTLE_MS / 1000) + 's with active player');
        cleanup(0);
      }
    }, SETTLE_MS);
  });

  ws.on('close', () => {
    if (!crashed) {
      // Server closed connection unexpectedly — check stderr
      if (stderrOutput && /TypeError|ReferenceError/.test(stderrOutput)) {
        crashed = true;
      }
    }
  });
}
