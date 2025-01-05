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

@Table({ tableName: "PanelSettings" })
export default class PanelSettings extends Model<LayoutAttrubuttes> {

    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id: number;

    @Column({ type: DataType.STRING, unique: true })
    declare setting: string;

    @Column({ type: DataType.TEXT({ length: 'long' }) })
    declare value: string;

};

interface LayoutAttrubuttes {
    id: number;
    setting: string;
    value: string;
};