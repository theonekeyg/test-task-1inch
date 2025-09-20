import 'dotenv/config';
import { performance } from 'node:perf_hooks';

async function main() {
  let baseUrl: string;
  if (!process.env.PORT) {
    baseUrl = 'http://localhost:3000';
  } else {
    baseUrl = `http://localhost:${process.env.PORT}`;
  }
  const url = `${baseUrl.replace(/\/$/, '')}/gasPrice`;

  console.log(`Target URL: ${url}`);

  try {
    const start = performance.now();

    // Node 18+ has global fetch. If your Node is older, install and import 'node-fetch'.
    const res = await fetch(url);
    const elapsedMs = performance.now() - start;

    if (!res.ok) {
      const text = await res.text().catch(() => '<no body>');
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }

    const json = (await res.json().catch(() => null)) as
      | { gasPriceRaw: string | null; gasPrice: number | null }
      | null;

    console.log(`Response:`, json);
    console.log(`Time took: ${elapsedMs.toFixed(2)} ms`);

    // Simple sanity check
    if (!json || json.gasPriceRaw == null || json.gasPrice == null) {
      console.warn('Warning: Response missing gas price fields');
    }
  } catch (err: any) {
    console.error(`Error: ${err?.message ?? err}`);
    process.exitCode = 1;
  }
}

// Execute when run directly (ts-node or tsx recommended)
main();