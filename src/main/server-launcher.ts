import { fork, ChildProcess } from 'child_process';
import path from 'path';

let serverProcess: ChildProcess | null = null;

export function startExpressServer(): void {
  // In development, the server runs separately via npm script
  // In production, we'd fork it here
  // For now, we'll skip auto-launching - server runs independently
  console.log('[Nexus] Express server should be started separately with: cd server && npm run dev');
}

export function stopExpressServer(): void {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}
