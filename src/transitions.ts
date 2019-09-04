import { canvas, context } from './consts';

interface TransitionOptions {
    time: number;
    render: (timestamp: number) => void;
}

interface FadeOptions extends TransitionOptions {
    from: number;
    to: number;
}

export const fade = (options: FadeOptions) => new Promise((resolve) => {
    let start = null;

    const frame = (timestamp) => {
        if (!start) {
            start = timestamp;
        }

        if (options.render) {
            options.render(timestamp);
        }
        const step = (timestamp - start) / options.time;
        const alpha = Math.min(1, options.from + (options.to - options.from) * step);
        context.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        context.fillRect(0, 0, canvas.width, canvas.height);

        if (timestamp < start + options.time) {
            requestAnimationFrame(frame);
        } else {
            resolve();
        }
    };

    requestAnimationFrame(frame);
});
