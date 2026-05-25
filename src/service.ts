import { DataSource } from "typeorm";
import { SocialEvent } from "./entity/SocialEvent"
import { Seat } from "./entity/Seat";
import Redis from "ioredis";


export default class Service {
    private db: DataSource;
    private cache: Redis;

    constructor(db: DataSource, cache: Redis) {
        this.db = db;
        this.cache = cache;
    }

    getSocialEventById(id: number) {
        return this.db.manager.findOne(SocialEvent, { where: { id } });
    }

    // needs refactoring divide responsibilites 
    async bookSeatEvent(socialEventId: number, bookingSeat: BookingSeat) {
        const id = parseInt(bookingSeat.seatId);
        const userId = parseInt(bookingSeat.userId);

        const seatCacheKey = `seat:${id}`
        const numberOfKeys = 1;
        let cacheResult: any = await this.cache.fcall('tryReserveSeat', numberOfKeys, seatCacheKey, userId);

        if (cacheResult == 1) {
            // Optimistic Path: Cache hit and successfully secured!
            // Fire-and-forget: Async update the primary DB in the background
            this.db.manager.update(Seat, { id }, {
                userId
            }).catch(err => console.error("Background DB Sync Failed:", err));

            return { success: true, message: "Seat reserved successfully!" };
        }

        // --- STEP 2: Handle Cache Conflict (-1) ---
        const currentCacheValue = await this.cache.get(seatCacheKey);

        if (currentCacheValue && currentCacheValue != `${userId}`) {
            return { success: false, message: "Sorry, this seat is already taken." };

        }
        // lazy load test
        // maybe eager loading if this does not work
        const seatToBook = await this.db.manager.findOne(Seat, { where: { id, socialEventId } });

        if (seatToBook == null) {
            return { success: false, message: "the seat has wrong values" }
        }

        if (seatToBook.userId) {
            // Lazy population: Cache the fact that this seat is taken so we don't hit the DB next time
            await this.cache.set(seatCacheKey, seatToBook.userId!);
            return { success: false, message: "Seat is already taken." };
        }

        // Secure the booking in SQL
        this.db.manager.update(Seat, { id }, {
            userId
        }).catch(err => console.error("Background DB Sync Failed:", err));

        // Update the cache so the next request hits Step 1 instantly
        await this.cache.set(seatCacheKey, userId);
        return { success: true, message: "Seat reserved successfully via database fallback!" };
    }

}