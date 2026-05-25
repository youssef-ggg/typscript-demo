import { DataSource } from "typeorm";
import { SocialEvent } from "./src/entity/SocialEvent"
import { User } from "./src/entity/User"
import { Seat } from "./src/entity/Seat";
import dotenv from "dotenv";

dotenv.config();

async function seed() {

    console.log('seed database...')
    try {
        const dataSource = new DataSource({
            type: 'better-sqlite3',
            database: process.env.DB_DATABASE || 'tickets.sqlite',
            synchronize: process.env.DB_SYNCHRONIZE == 'true',
            logging: process.env.DB_LOGGING == 'true',
            entities: [User, SocialEvent, Seat],
            migrations: [],
            subscribers: [],
        });

        const AppDataSource = await dataSource.initialize();
        console.log("Inserting a new user into the database...")

        const users: User[] = [];
        const TOTAL_REQUESTS = parseInt(process.env.TOTAL_REQUESTS || '200') 
        const SEATS_NUM = parseInt(process.env.SEATS_NUM || '10')
        // if (usersCount <= 0) {
        for (let i = 0; i < TOTAL_REQUESTS; i++) {
            const user = new User();
            user.firstName = `fan ${i + 1}`;

            users.push(user);
        }
        await AppDataSource.manager.createQueryBuilder()
            .insert()
            .into(User)
            .values(users)
            .execute();

        // }

        let socialEvent = new SocialEvent();
        socialEvent.title = '200 Concert';
        socialEvent.numberOfSeats = SEATS_NUM;

        await AppDataSource.manager.save(socialEvent);

        const seats: Seat[] = [];
        for (let i = 0; i < SEATS_NUM; i++) {
            const seat = new Seat();
            seat.seatNumber = i + 1;
            seat.socialEvent = socialEvent;
            seats.push(seat);
        }
        await AppDataSource.manager.createQueryBuilder()
            .insert()
            .into(Seat)
            .values(seats)
            .execute();

    } catch (error) {
        console.log(`failed to seed: ${error}`);
        return error;
    }
}

seed();