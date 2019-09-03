import * as transitions from './transitions';
import * as game from './game';
import * as debug from './debug';
import * as sprites from './sprites';
import * as worker from './worker';

export const start = () => {
    const OPTIONS_Y = 100;
    const OPTIONS_HEIGHT = 20;
    const START_GAME = 'START GAME';
    const options = [START_GAME];
    let finished = false;

    const canvas = document.querySelector('canvas');

    const mapCoordinates = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        return { x, y };
    };

    const mapOption = ({ y }) => Math.floor((y - OPTIONS_Y) / OPTIONS_HEIGHT);

    const render = () => {
        const context = canvas.getContext('2d');

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.textBaseline = 'top';
        context.fillStyle = 'white';
        context.fillText('LLAMA ADVENTURE', 110, 50);
        for (let i = options.length - 1; i >=0; i--) {
            context.fillStyle = '#444';
            context.fillRect(100, OPTIONS_Y + OPTIONS_HEIGHT * i, 120, OPTIONS_HEIGHT);
            context.fillStyle = 'white';
            context.fillText(options[i], 110, OPTIONS_Y + 5 + OPTIONS_HEIGHT * i);
        }
    };

    const handleOptionClick = async (option) => {
        if (options[option] === START_GAME) {
            finished = true;
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('touchend', handleTouchEnd);
            await transitions.fadeOut(render);
            await sprites.initialize();
            const newGame = game.create(await worker.createLevel());
            if (process.env.NODE_ENV === 'production') {
                game.start(newGame);
            } else {
                debug.start(newGame);
            }
        }
    };
    const handleClick = event => handleOptionClick(mapOption(mapCoordinates(event.clientX, event.clientY)));
    const handleTouchEnd = event => handleOptionClick(mapOption(mapCoordinates(event.changedTouches[0].clientX, event.changedTouches[0].clientY)));
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchend', handleTouchEnd);

    const loop = () => {
        if (finished) {
            return;
        }

        render();

        requestAnimationFrame(loop);
    };

    loop();
};
