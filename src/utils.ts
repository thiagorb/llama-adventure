export const deepCopy = obj => JSON.parse(JSON.stringify(obj));

export const cachedInstance = <T>(initializer: () => T) => {
    let instance: T = null;

    return () => instance = instance || initializer();
};
