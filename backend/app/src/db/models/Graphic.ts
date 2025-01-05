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
import Item from './Item'
import Layout from "./LayoutTable";
import LayoutTable from "./LayoutTable";

@Table({ tableName: "Graphic" })
class Graphic extends Model<GraphicAttributes> {

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.STRING)
  declare chartType: string;

  @Column(DataType.INTEGER)
  declare width: number;

  @Column(DataType.INTEGER)
  declare height: number;

  @HasMany(() => Item)
  declare itens: Item[];

  @ForeignKey(() => LayoutTable)
  @Column(DataType.INTEGER)
  declare layoutId: number;

  @BelongsTo(() => LayoutTable)
  declare layout: LayoutTable;
}

interface GraphicAttributes {
  id: number;
  name: string;
  width: number;
  height: number;
  chartType: string;
  itens: Item[];
  layoutId: number;
}

export default Graphic;