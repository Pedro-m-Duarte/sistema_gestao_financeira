import {
    AutoIncrement,
    Column,
    CreatedAt,
    DataType,
    Model,
    PrimaryKey,
    Table,
    Unique
} from "sequelize-typescript";
import Layout from "./Layouts";
import Report from "./Reports";

@Table({ tableName: "Users" })
export default class User extends Model<UserAttributes> {

    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER })
    declare id: number;

    @Unique
    @Column(DataType.STRING)
    declare username: string;

    @Column(DataType.STRING)
    declare preferenceAutoUpdatePanelItems: string; // 0 = Nunca (desligado)

    @Column(DataType.STRING)
    declare preferenceAutoDownloadPDFReportCopy: string; // Valores válidos: 'always' | 'ask' | 'never'.

    @CreatedAt
    declare createdAt: Date;

    getLayouts() {
        return Layout.findAll({
            where: {
                userId: this.id
            }
        });
    };

    getReports() {
        return Report.findAll({
            where: {
                userId: this.id
            }
        });
    };
};

interface UserAttributes {
    id: number;
    username: string;
    preferenceAutoUpdatePanelItems: string;
    preferenceAutoDownloadPDFReportCopy: string;
    createdAt: Date;

    getLayouts(): Promise<Layout[]>;
    getReports(): Promise<Report[]>;
};