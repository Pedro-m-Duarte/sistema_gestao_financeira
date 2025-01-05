import { Sequelize } from 'sequelize-typescript';
import PanelSettings from "./models/PanelSettings";
import User from "./models/User";
import Layout from "./models/Layouts";
import Report from './models/Reports';
import LayoutTable from './models/LayoutTable';
import Item from './models/Item'
import Graphic from './models/Graphic';
import TemplateOrServer from './models/TemplateOrServer';
import {
    BACKEND_DB_NAME,
    BACKEND_DB_PASS,
    BACKEND_DB_USER,
    BACKEND_DB_HOST,
    BACKEND_DB_PORT,
    BACKNED_DB_DIALECT
} from '../../env';
import { pr } from '../../server';
import { createDefaultSettings } from '../../src/utils/PanelSettingsAdapter';

const DBConnector = new Sequelize(BACKEND_DB_NAME, BACKEND_DB_USER, BACKEND_DB_PASS, {
    dialect: BACKNED_DB_DIALECT,
    storage: './db.sql',
    host: BACKEND_DB_HOST,
    port: BACKEND_DB_PORT,
    logging: false,
    models: [
        PanelSettings,
        User,
        Layout,
        Report,
        Graphic,
        Item,
        LayoutTable,
        TemplateOrServer
    ]
});

export default DBConnector;

export const setupDB = async () => {
    await DBConnector.authenticate()
    await DBConnector.sync({ force: false })
    await createDefaultSettings();
    console.log(`${pr.b} DB conectada e sincronizada.`);
}