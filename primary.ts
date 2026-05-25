import cluster, { Worker } from "cluster";
import os from "os";
import { dirname } from "path";
// import fs from 'fs';

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cpuCount = os.cpus().length;

console.log(`Total number of CPUs is ${cpuCount}`)
console.log(`Primary pid=${process.pid}`)

cluster.setupPrimary({
    exec: `${__dirname}/index.ts`
});

for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
}

cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} has been killed`);
    console.log('starting another worker')
    cluster.fork()

})