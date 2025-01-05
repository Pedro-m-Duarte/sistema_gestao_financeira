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

import TemplateOrServer from './TemplateOrServer'
import Graphic from './Graphic'

// Modelo para Layout
@Table({ tableName: "LayoutTable" })
class LayoutTable extends Model<LayoutAttributes> {

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => TemplateOrServer)
  @Column(DataType.INTEGER)
  declare templateOrServerId: number;

  @BelongsTo(() => TemplateOrServer)
  declare templateOrServer: TemplateOrServer;

  @Column(DataType.STRING)
  declare layoutName: string;

  @HasMany(() => Graphic) 
  declare graphics: Graphic[];

  @Column(DataType.BOOLEAN)
  declare createdByAdminPage: string;
}

interface LayoutAttributes {
  templateOrServerId: string;
  layoutName: string;
  graphics: Graphic[];
  createdByAdminPage: Boolean;
}

export default LayoutTable;