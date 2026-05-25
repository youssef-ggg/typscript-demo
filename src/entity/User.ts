import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {

    @PrimaryGeneratedColumn("increment")
    id!: number

    @Column({ type: "varchar", length: 150 })
    firstName!: string

    // @Column()
    // lastName: string

    // @Column()
    // age: number

}
