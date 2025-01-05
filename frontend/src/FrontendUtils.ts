import Swal from "sweetalert2";

export function generatePastelColor(alpha = 0.3) {
    const r = Math.floor(Math.random() * 256); // Red color channel (0-255)
    const g = Math.floor(Math.random() * 256); // Green color channel (0-255)
    const b = Math.floor(Math.random() * 256); // Blue color channel (0-255)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

export function popupErrorWarn(errorMessage: string, err: any | undefined = undefined, popupCallback: () => void = () => {}) {
    console.log(errorMessage, err);
    Swal.fire({
        title: 'Ops...',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: 'red'
    }).then(popupCallback);
}