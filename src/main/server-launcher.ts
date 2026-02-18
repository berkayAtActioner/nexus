import { startEmbeddedServer, stopEmbeddedServer } from './embedded-server';

export function startExpressServer(): void {
  startEmbeddedServer();
}

export function stopExpressServer(): void {
  stopEmbeddedServer();
}
