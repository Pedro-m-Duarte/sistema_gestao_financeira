export interface UserPreferences {
    autoUpdatePanelItems: string;
    autoDownloadPDFReportCopy: string;
}

export function formatDateAsBRString(dateNumber: number, showTime: boolean = true): string {
    const date = new Date(dateNumber);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months start from zero
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}${showTime ? ` às ${hours}:${minutes}:${seconds}` : ``}`;
}