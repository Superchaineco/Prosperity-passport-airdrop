import { createClient } from 'redis';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) =>
  console.error('Error when connecting to the client', err)
);

async function main() {
  try {
    await client.connect();

    const jsonData = fs.readFileSync(
      '../optimized_merkle_tree_generation/output.json',
      'utf8'
    );
    const parsedData = JSON.parse(jsonData);

    // Eliminar la key existente
    await client.del('airdrop-allowlist');

    const response = await client.json.set(
      'airdrop-allowlist',
      '$',
      parsedData
    );
    console.log('Response:', response);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.disconnect();
    console.log('Client disconnected');
  }
}

main();
