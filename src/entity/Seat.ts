import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { SocialEvent } from "./SocialEvent";
import { User } from "./User"; // Import your existing User entity here!

@Entity({ name: "seats" })
export class Seat {
    @PrimaryGeneratedColumn("increment")
    id!: number;

    @Column({ type: "int", name: "seat_number" })
    seatNumber!: number;


    @Column({ type: "int", name: "user_id", nullable: true })
    userId!: number | null; // Raw column for the user foreign key

    @Column({ type: "int", name: "social_event_id" })
    socialEventId!: number; // Raw column for the social event foreign key

    // 1. Establish relation to your existing User entity
    @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
    @JoinColumn({ name: "user_id" }) // Automatically maps the user's integer ID as a foreign key
    user!: User;

    // 2. Relation to the SocialEvent
    @ManyToOne(() => SocialEvent, { onDelete: "CASCADE" })
    @JoinColumn({ name: "social_event_id" })
    socialEvent!: SocialEvent;
}