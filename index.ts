import express from 'express';
import dotenv from "dotenv";

import { initDb } from './src/data-source';
import buildRoutes from './src/routes';
import Service from './src/service';
import initCache from './src/cache';

dotenv.config();

const app = express();
const port = process.env.SERVER_PORT || 5001;

// intialize database connection
const startServer = async () => {
    try {
        const db = await initDb();
        const cache = await initCache();
        if (db != null) {
            const service = new Service(db, cache);
            const routes = buildRoutes(service);

            app.use(express.json());
            app.use(routes);
            app.listen(port, () => {
                console.log(`Server running at http://localhost:${port}`);
                console.log(`worker pid=${process.pid}`)
            });
        } else {
            console.log('failed to start server without throwing an error');
        }
    } catch (error) {
        console.log('failed to start server');
        console.log(error)
    }
}

startServer();