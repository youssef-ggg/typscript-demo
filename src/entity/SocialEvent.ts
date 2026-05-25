import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "social_events" }) // Explicitly naming the table in lowercase/plural
export class SocialEvent {
    @PrimaryGeneratedColumn("increment")
    id!: number;

    @Column({ type: "varchar", length: 150 })
    title!: string;

    // We use 'int' for database compatibility; it maps to a standard number in JS/TS
    @Column({ type: "int", name: "number_of_seats" })
    numberOfSeats!: number;
}