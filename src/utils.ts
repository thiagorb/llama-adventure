export const deepCopy = obj => {
    if (obj.constructor !== Object) {
        return obj;
    }

    const copy = {};
    Object.keys(obj).forEach(k => copy[k] = deepCopy(obj[k]));
    return copy;
};
