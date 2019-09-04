import { canvas } from './consts';

export const drawButton = (context: CanvasRenderingContext2D, label: string, x: number, y: number, width: number, height: number) => {
    context.fillStyle = '#444';
    context.fillRect(x, y, width, height);
    context.fillStyle = 'white';
    context.fillText(label, x + 10, y + 5);
};

export const mapClickCoordinates = callback => {
    const wrapped = mapCoordinates(callback);
    return event => wrapped(event.clientX, event.clientY);
};

export const mapTouchCoordinates = callback => {
    const wrapped = mapCoordinates(callback);
    return event => wrapped(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
};

export const mapCoordinates = callback => (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    callback(x, y);
};
