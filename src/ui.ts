import { BUTTON_HEIGHT, canvas, context } from './consts';

interface Button {
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export const createButton = (label: string, x: number, y: number, width: number, height: number): Button => ({
    label,
    x,
    y,
    width,
    height,
});

export const drawButton = (button: Button) => {
    context.fillStyle = '#444';
    context.fillRect(button.x, button.y, button.width, button.height);
    context.fillStyle = 'white';
    context.fillText(button.label, button.x + 10, button.y + 5);
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

export const createListener = (button: Button, callback) => {
    const checkButton = (x, y) => {
        if (x >= button.x && x < button.x + button.width && y >= button.y && y < button.y + button.height) {
            callback();
        }
    };
    const handleClick = mapClickCoordinates(checkButton);
    const handleTouchEnd = mapTouchCoordinates(checkButton);

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchend', handleTouchEnd);

    return {
        remove: () => {
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('touchend', handleTouchEnd);
        }
    }
};
