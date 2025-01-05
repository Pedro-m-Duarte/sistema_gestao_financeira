import {
    AutoIncrement,
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
} from "sequelize-typescript";
import User from "./User";

@Table({ tableName: "Reports" })
export default class Report extends Model<LayoutAttrubuttes> {

    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER })
    declare id: number;

    @Column({ type: DataType.INTEGER })
    declare serverId: number;

    @Column({ type: DataType.BIGINT })
    declare generatedAt: number;

    @Column({ type: DataType.TEXT({ length: 'medium' }) })
    declare generatedTimePeriod: string

    @Column({ type: DataType.TEXT({ length: 'long' }) })
    declare data: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: true })  // Adicionando allowNull: true
    declare userId: number | null;  // Adicionando | null para indicar que o valor pode ser nulo

    @BelongsTo(() => User)
    declare user: User;

    @CreatedAt
    declare createdAt: Date;

};

interface LayoutAttrubuttes {
    id: number;
    serverId: number;
    generatedAt: number,
    generatedTimePeriod: string,
    data: string; // All report data (Graphs as Base64, descriptions, etc.) is here as a JSON
    userId: number | null;
    user: User | null; // Requester of the report
    createdAt: Date;
};