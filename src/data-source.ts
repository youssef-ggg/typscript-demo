import "reflect-metadata"
import { DataSource } from "typeorm"

import { User } from "./entity/User"
import { SocialEvent } from "./entity/SocialEvent"
import { Seat } from "./entity/Seat"


export async function initDb() {
    const dataSource = new DataSource({
        type: 'better-sqlite3',
        database: process.env.DB_DATABASE || 'tickets.sqlite',
        synchronize: process.env.DB_SYNCHRONIZE == 'true',
        logging: process.env.DB_LOGGING == 'true',
        entities: [User, SocialEvent, Seat],
        migrations: [],
        subscribers: [],
    });

    try {
        const connection = await dataSource.initialize();
        
        return connection;
    } catch (error) {
        console.log(error);
        return null;
    }
}