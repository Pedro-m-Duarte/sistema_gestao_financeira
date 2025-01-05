export interface TemplateOrServer {
    templateId: string,
    name: string,
}
export interface Item {
    id: number;
    name: string;
    itemId: string;
    key: string;
    colorLine: string;
    isDicoveryItem: boolean;
}

export interface DiscoveryItemData {
    name: string;
    itemId: string;
    key: string;
}

export interface AvailableItem {
    name: string;
    hostid: string;
    key_: string;
}

export interface GraphicDesignProps {
    graphic: Graphic;
    templateOrServerId: String;
}

export interface ChartDataResults {
    itemid: string;
    itemName: string;
    color: string;
    history: HistoryData[];
    isDicoveryItem: boolean;
}

export interface HistoryData {
    clock: string;
    value: string;
    ns: string;
}

export interface Graphic {
    id: number;
    name: string;
    width: number;
    height: number;
    chartType: string;
    items: Item[];
}

export interface Layout {
    id: number;
    templateOrServer: TemplateOrServer;
    layoutName: string;
    graphics: Graphic[];
}

export interface SavedLayouts {
    layoutId: number;
    layoutName: string;
    serverName: string;
}

export interface GraphicFormProps {
    serverId: string;
    serverName: string;
    isAdmPage: boolean;
    onSubmit?: (submitFunc: () => void) => void; // Modifique esta linha
}

export interface LabelProps {
    name: string;
    value: number;
    percent: number;
    x: number;
    y: number;
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    index: number;
  }
  
