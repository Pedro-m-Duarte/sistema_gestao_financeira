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
import Graphic from "./Graphic";

@Table({ tableName: "Item" })
class Item extends Model<ItemAttributes> {

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.STRING)
  declare itemId: string;

  @Column(DataType.STRING)
  declare key: string;

  @Column(DataType.STRING)
  declare colorLine: string;

  @Column(DataType.BOOLEAN)
  declare isDicoveryItem: boolean;

  @ForeignKey(() => Graphic)
  @Column(DataType.INTEGER)
  declare graphicId: number;

  @BelongsTo(() => Graphic)
  declare graphic: Graphic;
}

interface ItemAttributes {
  id: number;
  name: string;
  itemId: string;
  key: string;
  colorLine: string;
  graphicId: number;
  isDicoveryItem: boolean;
}

export default Item;