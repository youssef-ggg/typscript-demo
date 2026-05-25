import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';
import Redis from 'ioredis';

// 2. Recreate __dirname using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function initCache() {
    const valkeyClient = new Redis({
        host: process.env.CACHE_HOST || 'localhost',
        port: parseInt(process.env.CACHE_PORT || '6379')
    });

    // These to lines are to help the valkeyClient get the lua script that helps to make tryReserveSeat an ATOMIC method
    const scriptPath = path.join(__dirname, 'valkey-scripts', 'index.lua');
    const scriptCode = fs.readFileSync(scriptPath, 'utf-8');

    await valkeyClient.call('FUNCTION', 'LOAD', 'REPLACE', scriptCode);

    return valkeyClient;

}