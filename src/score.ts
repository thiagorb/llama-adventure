import * as ui from './ui';
import * as transitions from './transitions';
import { BUTTON_HEIGHT, canvas, context, LOCAL_STORAGE_NAMESPACE } from './consts';
import * as game from './game';
import * as highscore from './highscore';
import * as home from './home';

export const start = ({ lastGame, renderGame }: { lastGame: game.Game, renderGame: () => void }) => {
    let finished = false;
    const time = Math.floor(lastGame.time);
    const timeBonus = lastGame.status === game.Status.Won ? Math.floor(5000 / Math.log(100 + time)) : 0;
    const score = lastGame.score + timeBonus;

    const isHighscore = score > 0 && highscore
        .getHighscore()
        .filter(entry => highscore.compareHighscore(entry, { score, time }) <= 0)
        .length < highscore.MAX_ENTRIES - 1;

    const keyboard: Array<{ button: ui.Button, listener: ui.Listener }> = [];
    let name = localStorage.getItem(`${LOCAL_STORAGE_NAMESPACE}.name`) || '';
    const codeA = 'A'.charCodeAt(0);
    const codeZ = 'Z'.charCodeAt(0);
    const addChar = (char) => {
        if (name.length < highscore.MAX_NAME_LENGTH) {
            name += char;
        }
    };
    const removeChar = () => name = name.slice(0, -1);
    const handleKeyDown = (event: KeyboardEvent) => {
        const key = event.key.toUpperCase();
        if (key.length === 1 && key.charCodeAt(0) >= codeA && key.charCodeAt(0) <= codeZ) {
            addChar(key);
        } else if (key === ' ') {
            addChar(' ');
        } else if (key === 'BACKSPACE') {
            removeChar();
        }
    };
    if (isHighscore) {
        document.addEventListener('keydown', handleKeyDown);
        for (let i = 0; i <= codeZ - codeA; i++) {
            const letter = String.fromCharCode(codeA + i);
            const button = ui.createButton(
                letter,
                22 + (i % 11) * 25,
                125 + Math.floor(i / 11) * 25,
                20,
                BUTTON_HEIGHT
            );
            keyboard.push({
                button,
                listener: ui.createListener(button, () => addChar(letter)),
            });
        }

        const spaceBar = ui.createButton('SPACE', 122, 175, 45, BUTTON_HEIGHT);
        keyboard.push({
            button: spaceBar,
            listener: ui.createListener(spaceBar, () => addChar(' ')),
        });

        const backspace = ui.createButton('←', 172, 175, 20, BUTTON_HEIGHT);
        keyboard.push({
            button: backspace,
            listener: ui.createListener(backspace, removeChar),
        });
    }

    const render = () => {
        renderGame();
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText('SCORE', 160, 15);
        context.textAlign = 'left';
        context.fillText('COLLECTED ITEMS', 70, 35);
        if (timeBonus) {
            context.fillText('TIME BONUS', 70, 50);
        }
        context.fillText('TOTAL', 70, 75);
        context.textAlign = 'right';
        context.fillText(<any>lastGame.score, 240, 35);
        if (timeBonus) {
            context.fillText(<any>timeBonus, 240, 50);
        }
        context.fillText(<any>score, 240, 75);

        ui.drawButton(okayButton);
        if (isHighscore) {
            context.textAlign = 'left';
            context.fillText(`ENTER YOUR NAME: ${name}_`, 70, 105);
            keyboard.forEach(({ button }) => ui.drawButton(button));
        }
    };

    const okayButton = ui.createButton('OKAY', 135, 205, 50, BUTTON_HEIGHT);
    const okayListener = ui.createListener(okayButton, async () => {
        finished = true;
        okayListener.remove();
        keyboard.forEach(({ listener }) => listener.remove());
        document.removeEventListener('keydown', handleKeyDown);
        localStorage.setItem(`${LOCAL_STORAGE_NAMESPACE}.name`, name);
        highscore.register({ score, name, world: lastGame.level.id, time });
        await transitions.fade({ time: 300, from: 0.5, to: 0, render: renderGame });
        highscore.start(renderGame, () => home.start({ lastGame }));
    });

    const loop = (timestamp) => {
        if (finished) {
            return;
        }

        render();

        requestAnimationFrame(loop);
    };

    transitions.fade({ time: 300, from: 0, to: 0.5, render: renderGame }).then(loop);
};
