import { cachedInstance } from './utils';

export interface Keys {
    readonly ArrowUp: boolean;
    readonly ArrowRight: boolean;
    readonly ArrowDown: boolean;
    readonly ArrowLeft: boolean;
}

export const getKeys = cachedInstance(() => {
    const state = {
        ArrowUp: false,
        ArrowRight: false,
        ArrowDown: false,
        ArrowLeft: false,
    };

    const keyMap = {
        arrowup: 'ArrowUp',
        arrowleft: 'ArrowLeft',
        arrowdown: 'ArrowDown',
        arrowright: 'ArrowRight',
        w: 'ArrowUp',
        a: 'ArrowLeft',
        s: 'ArrowDown',
        d: 'ArrowRight',
    };

    const flagKey = key => state[key] = true;
    const unflagKey = key => state[key] = false;

    const filterKey = callback => event => {
        const key = keyMap[event.key.toLowerCase()];
        if (key) {
            callback(key);
        }
    };

    document.addEventListener('keydown', filterKey(flagKey));
    document.addEventListener('keyup', filterKey(unflagKey));

    const isTouchDevice = () => {
        try {
            document.createEvent('TouchEvent');
            return true;
        } catch (e) {
            return false;
        }
    };

    if (isTouchDevice()) {
        document.body.classList.add('touch');

        const setActive = callback => event => {
            (event.target as HTMLDivElement).classList.add('is-active');
            callback(event);
        };

        const unsetActive = callback => event => {
            (event.target as HTMLDivElement).classList.remove('is-active');
            callback(event);
        };

        const filterTouch = callback => event => {
            event.preventDefault();
            const key = (event.target as HTMLDivElement).getAttribute('data-touch-key');
            if (key in state) {
                callback(key);
            }
        };

        document.addEventListener('touchstart', setActive(filterTouch(flagKey)));
        document.addEventListener('touchend', unsetActive(filterTouch(unflagKey)));
    }

    return state;
});
