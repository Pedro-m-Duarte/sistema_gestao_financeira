import {
    AutoIncrement,
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    ForeignKey,
    Max,
    Model,
    PrimaryKey,
    Table
} from "sequelize-typescript";
import User from "./User";

@Table({ tableName: "Layouts" })
export default class Layout extends Model<LayoutAttrubuttes> {

    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER })
    declare id: number;

    @Column(DataType.STRING)
    declare name: string;

    @Max(65535)
    @Column({ type: DataType.TEXT })
    declare data: string;

    @ForeignKey(() => User)
    @Column(DataType.INTEGER)
    declare userId: number;

    @BelongsTo(() => User)
    declare user: User;

    @CreatedAt
    declare createdAt: Date;

};

interface LayoutAttrubuttes {
    id: number;
    name: string;
    data: string;
    userId: number;
    user: User;
    createdAt: Date;
};