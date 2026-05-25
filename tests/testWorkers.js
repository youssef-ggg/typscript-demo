import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';


dotenv.config()
// Resolve __filename for ES Modules so the worker knows which file to execute
const __filename = fileURLToPath(import.meta.url);

// --- CONFIGURATION ---
const TARGET_URL = 'http://localhost:5000/events/1/purchase/';
const TOTAL_REQUESTS = parseInt(process.env.TOTAL_REQUESTS) || 200;
const SEATS_NUM = parseInt(process.env.SEATS_NUM) || 10;
const CONCURRENCY_LIMIT = 10; // Number of parallel worker threads to spin up
const LOG_FILE_PATH = path.join(process.cwd(), 'benchmark_responses.log');

// Helper function to get a random integer between min and max (inclusive)
function getRandomSeat(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ==========================================
// WORKER THREAD LOGIC
// ==========================================
if (!isMainThread) {
    const { startId, endId } = workerData;
    const results = [];

    // This worker handles a specific slice of the total requests
    for (let userId = startId; userId <= endId; userId++) {
        const seatId = getRandomSeat(1, parseInt(process.env.SEATS_NUM) || 10);
        const payload = { userId, seatId };
        let logEntry = '';
        let success = false;
        let status = null;

        try {
            const response = await fetch(TARGET_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            success = response.ok;
            status = response.status;

            let responseData;
            try {
                responseData = await response.json();
            } catch {
                responseData = await response.text();
            }

            logEntry = `[${new Date().toISOString()}] User #${userId} -> Seat #${seatId} | Status: ${status} | Response: ${JSON.stringify(responseData)}\n`;
        } catch (error) {
            success = false;
            logEntry = `[${new Date().toISOString()}] User #${userId} -> Seat #${seatId} | ERROR: ${error.message}\n`;
        }

        // Send logs and results back to the main thread
        parentPort.postMessage({ type: 'LOG', data: logEntry });
        results.push({ userId, success, status });
    }

    // Signal completion and send back the summary data
    parentPort.postMessage({ type: 'RESULT', data: results });
    process.exit(0);
}

// ==========================================
// MAIN THREAD LOGIC
// ==========================================
if (isMainThread) {
    async function runBenchmark() {
        console.log(` Starting high-concurrency MULTI-THREADED race condition test...`);
        console.log(`Threads: ${CONCURRENCY_LIMIT} | Users: 1 to ${TOTAL_REQUESTS} | Seats: 1 to ${SEATS_NUM}`);
        console.log(`Target: ${TARGET_URL}\n`);

        fs.writeFileSync(LOG_FILE_PATH, `--- RACE CONDITION MULTI-THREAD TEST START (${new Date().toISOString()}) ---\n\n`);

        const startTime = performance.now();
        const workerPromises = [];

        // Calculate how many requests each worker should handle
        const requestsPerWorker = Math.ceil(TOTAL_REQUESTS / CONCURRENCY_LIMIT);
        let allResults = [];

        for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
            const startId = i * requestsPerWorker + 1;
            const endId = Math.min(startId + requestsPerWorker - 1, TOTAL_REQUESTS);

            if (startId > TOTAL_REQUESTS) break;

            workerPromises.push(new Promise((resolve, reject) => {
                const worker = new Worker(__filename, {
                    workerData: { startId, endId }
                });

                // Handle communication coming from the workers
                worker.on('message', (message) => {
                    if (message.type === 'LOG') {
                        // Main thread handles writing to file to prevent concurrent write collisions
                        fs.appendFileSync(LOG_FILE_PATH, message.data);
                    } else if (message.type === 'RESULT') {
                        allResults = allResults.concat(message.data);
                    }
                });

                worker.on('error', reject);
                worker.on('exit', (code) => {
                    if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
                    else resolve();
                });
            }));
        }

        // Wait for all worker threads to finish processing their loops
        await Promise.all(workerPromises);

        const endTime = performance.now();
        const totalDurationMs = endTime - startTime;
        const successfulRequests = allResults.filter(r => r.success).length;
        const failedRequests = TOTAL_REQUESTS - successfulRequests;

        const summary = `
--- BENCHMARK SUMMARY ---
Total Requests (Users):  ${TOTAL_REQUESTS}
Threads Used:         ${CONCURRENCY_LIMIT}
Successful Requests:  ${successfulRequests}
Failed/Rejected:      ${failedRequests}
Total Time:           ${(totalDurationMs / 1000).toFixed(2)} seconds
Avg Speed:            ${Math.round(TOTAL_REQUESTS / (totalDurationMs / 1000))} req/sec
-------------------------
`;
        fs.appendFileSync(LOG_FILE_PATH, summary);

        console.log(summary);
        console.log(`Test complete. Check "benchmark_responses.log" to see who won the seats!`);
    }

    runBenchmark();
}