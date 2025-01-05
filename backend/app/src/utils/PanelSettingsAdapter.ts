import PanelSettings from "../db/models/PanelSettings";

// Panel Settings Types
export const PanelSettingType = {
    IsDashAvailable: { defaultSetting: true },
    ServersToGenerateMonthlyReport: { defaultSetting: [] },
};

export async function createDefaultSettings() {
    for (const setting in PanelSettingType) {
        const existingSetting = await PanelSettings.findOne({
            where: {
                setting: setting
            }
        });
        if (!existingSetting) {
            await PanelSettings.create({
                setting: setting,
                value: JSON.stringify(PanelSettingType[setting].defaultSetting)
            });
        }
    }
}

export interface SettingValueData {
    setting: string;
    value: any;
}

export async function getPanelSettings(): Promise<SettingValueData[]> {
    const data = await PanelSettings.findAll();
    const settingsValues = data.map((setting) => {
        return {
            setting: setting.setting,
            value: JSON.parse(setting.value)
        };
    });
    return settingsValues;
}