import { getKeys } from './keys';

export const start = (callback) => {
    const OPTIONS_Y = 100;
    const OPTIONS_HEIGHT = 20;
    let seletedOption = 0;
    const START_GAME = 'START GAME';
    const options = [START_GAME];
    let previousUp = false;
    let previousDown = false;
    let fadingOut = 0;

    const canvas = document.querySelector('canvas');

    const mapCoordinates = callback => event => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        callback(x, y);
    };

    const mapOption = callback => mapCoordinates((x, y) => callback(Math.max(
        0,
        Math.min(
            options.length - 1,
            Math.floor((y - OPTIONS_Y) / OPTIONS_HEIGHT)
        )
    )));

    canvas.addEventListener('mousemove', mapOption(option => seletedOption = option));
    canvas.addEventListener('click', mapOption(option => {
        if (options[option] === START_GAME) {
            fadingOut = 1;
        }
    }));

    const loop = () => {
        if (!previousUp && getKeys().ArrowUp) {
            seletedOption = (options.length + seletedOption - 1) % options.length;
        }
        if (!previousDown && getKeys().ArrowDown) {
            seletedOption = (seletedOption + 1) % options.length;
        }
        previousUp = getKeys().ArrowUp;
        previousDown = getKeys().ArrowDown;

        const context = canvas.getContext('2d');

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';
        context.fillText('LLAMA ADVENTURE', 100, 50);
        for (let i = options.length - 1; i >=0; i--) {
            context.fillText(options[i], 100, OPTIONS_Y + OPTIONS_HEIGHT * i);
        }

        context.fillStyle = 'blue';
        context.textBaseline = 'top';
        context.save();
        context.translate(95, 105 + seletedOption * OPTIONS_HEIGHT);
        context.beginPath();
        context.moveTo(-15, -2);
        context.lineTo(-7, -2);
        context.lineTo(-7, -7);
        context.lineTo(0, 0);
        context.lineTo(-7, 7);
        context.lineTo(-7, 2);
        context.lineTo(-15, 2);
        context.fill();
        context.restore();

        if (fadingOut > 0) {
            context.fillStyle = `rgba(0, 0, 0, ${((fadingOut) / 19)})`;
            context.fillRect(0, 0, canvas.width, canvas.height);
            fadingOut++;

            if (fadingOut === 20) {
                callback();
                return;
            }
        }
        requestAnimationFrame(loop);
    };

    loop();
};
