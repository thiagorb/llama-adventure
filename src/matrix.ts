type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array;

export interface Matrix<T extends TypedArray> {
    rows: number;
    cols: number;
    values: T;
}

const _iterate = (rows, cols, callback) => {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            callback(row, col);
        }
    }
};

export const create = <T extends TypedArray>(Type: { new (length: number): T; }, rows: number, cols: number, init: (row: number, col: number) => number): Matrix<T> => {
    const values = new Type(rows * cols);
    const matrix = { rows, cols, values };
    iterate(matrix, (row, col) => values[row * cols + col] = init(row, col));
    return matrix;
};

export const iterate = <T extends TypedArray>(matrix: Matrix<T>, callback: (row: number, col: number, value: number) => void) => {
    _iterate(matrix.rows, matrix.cols, (row, col) => callback(row, col, get(matrix, row, col)));
};

export const get = <T extends TypedArray>(matrix: Matrix<T>, row: number, col: number) => {
    if (process.env.NODE_ENV === 'development') {
        if (!has(matrix, row, col)) {
            throw new Error(`Invalid cell {${row}, ${col }}`);
        }
    }
    return matrix.values[row * matrix.cols + col];
};

export const set = <T extends TypedArray>(matrix: Matrix<T>, row: number, col: number, value: number) => {
    if (process.env.NODE_ENV === 'development') {
        if (!has(matrix, row, col)) {
            throw new Error(`Invalid cell {${row}, ${col }}`);
        }
    }
    matrix.values[row * matrix.cols + col] = value;
};

export const has = <T extends TypedArray>(matrix: Matrix<T>, row, col) => row >= 0 && col >= 0 && row < matrix.rows && col < matrix.cols;

export const getCols = <T extends TypedArray>(matrix: Matrix<T>) => matrix.cols;
export const getRows = <T extends TypedArray>(matrix: Matrix<T>) => matrix.rows;
