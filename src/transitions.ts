const FADE_TIME = 500; //milliseconds

export const fadeOut = (render = null) => new Promise((resolve) => {
    const canvas = document.querySelector('canvas');
    let start = null;

    const frame = (timestamp) => {
        if (!start) {
            start = timestamp;
        }

        const context = canvas.getContext('2d');
        if (render) {
            render();
        }
        const alpha = Math.min(1, (timestamp - start) / FADE_TIME);
        context.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        context.fillRect(0, 0, canvas.width, canvas.height);

        if (timestamp < start + FADE_TIME) {
            requestAnimationFrame(frame);
        } else {
            resolve();
        }
    };

    requestAnimationFrame(frame);
});
