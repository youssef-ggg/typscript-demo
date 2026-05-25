import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';

dotenv.config

// --- CONFIGURATION ---
const TARGET_URL = 'http://localhost:5000/events/1/purchase/';
const TOTAL_REQUESTS = process.env.TOTAL_REQUESTS;
const LOG_FILE_PATH = path.join(process.cwd(), 'benchmark_responses.log');

// Helper function to get a random integer between min and max (inclusive)
function getRandomSeat(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function runBenchmark() {
    console.log(` Starting high-concurrency race condition test...`);
    console.log(`Users: 1 to 200 | Seats: 1 to 10`);
    console.log(` Target: ${TARGET_URL}\n`);

    // Clear/initialize the log file
    fs.writeFileSync(LOG_FILE_PATH, `--- RACE CONDITION TEST START (${new Date().toISOString()}) ---\n\n`);

    const startTime = performance.now();

    // Create 200 parallel promises mapping 200 unique users to 10 random seats
    const requestPromises = Array.from({ length: TOTAL_REQUESTS }, async (_, index) => {
        const userId = index + 1;          // Users 1 through 200
        const seatId = getRandomSeat(1, 10); // Random seat between 1 and 10

        const payload = { userId, seatId };
        let logEntry = '';
        let success = false;
        let status = null;

        try {
            const response = await fetch(TARGET_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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

        // Write immediately to file to preserve real-time order of completion
        fs.appendFileSync(LOG_FILE_PATH, logEntry);

        return { userId, success, status };
    });

    // Fire all 200 requests simultaneously 
    const results = await Promise.all(requestPromises);

    const endTime = performance.now();
    const totalDurationMs = endTime - startTime;
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = TOTAL_REQUESTS - successfulRequests;

    const summary = `
--- BENCHMARK SUMMARY ---
Total Requests (Users):  ${TOTAL_REQUESTS}
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