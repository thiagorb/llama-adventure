import * as ui from './ui';
import * as transitions from './transitions';
import { BUTTON_HEIGHT, canvas, context, LOCAL_STORAGE_NAMESPACE } from './consts';

export const MAX_ENTRIES = 10;
export const MAX_NAME_LENGTH = 10;

export interface Entry {
    name: string;
    world: number;
    time: number;
    score: number;
}

export const start = (background, nextScreen) => {
    let finished = false;

    const highscore = getHighscore();

    const render = (timestamp) => {
        background(timestamp);
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText('HIGH SCORE', 160, 5);
        context.textAlign = 'left';
        context.fillText('NAME', 36, 30);
        context.fillText('WORLD #', 112, 30);
        context.fillText('TIME', 182, 30);
        context.fillText('SCORE', 232, 30);

        for (let i = 0; i < 10; i++) {
            const entry = highscore[i] || {
                name: '---',
                world: '---',
                time: '---',
                score: '---',
            };
            context.fillText(entry.name, 36, 45 + i * 15);
            context.fillText(entry.world as string, 112, 45 + i * 15);
            context.fillText(entry.time as string, 182, 45 + i * 15);
            context.fillText(entry.score as string, 232, 45 + i * 15);
        }

        ui.drawButton(okayButton);
    };

    const okayButton = ui.createButton('OKAY', 135, 205, 50, BUTTON_HEIGHT);
    const okayListener = ui.createListener(okayButton, async () => {
        finished = true;
        okayListener.remove();
        await transitions.fade({ time: 300, from: 0.5, to: 0, render: background });
        nextScreen();
    });

    const loop = (timestamp) => {
        if (finished) {
            return;
        }

        render(timestamp);

        requestAnimationFrame(loop);
    };

    transitions.fade({ time: 300, from: 0, to: 0.5, render: background }).then(loop);
};

type Subset<T extends U, U> = U;
export const compareHighscore = (a: Subset<Entry, { score, time }>, b: Subset<Entry, { score, time }>) => {
    if (a.score > b.score) {
        return -1;
    }

    if (a.score < b.score) {
        return 1;
    }

    return a.time - b.time;
};

export const register = (entry: Entry) => {
    const highscore = getHighscore()
        .concat([entry])
        .sort(compareHighscore)
        .slice(0, MAX_ENTRIES);

    localStorage.setItem(`${LOCAL_STORAGE_NAMESPACE}.highscore`, JSON.stringify(highscore));
};

export const getHighscore = (): Array<Entry> => {
    const storage = localStorage.getItem(`${LOCAL_STORAGE_NAMESPACE}.highscore`);

    return storage ? JSON.parse(storage): [];
};
