import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

// Modelo para TemplateOrServer
@Table({ tableName: "TemplateOrServer" })
class TemplateOrServer extends Model<TemplateOrServerAttributes> {

  @PrimaryKey
  @Column(DataType.INTEGER)
  declare templateId: number;

  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.BOOLEAN)
  declare isServer: string;
}

interface TemplateOrServerAttributes {
  templateId: number;
  name: string;
  isServer: boolean;
}

export default TemplateOrServer;