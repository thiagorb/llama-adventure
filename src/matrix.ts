export interface Matrix {
    rows: number;
    cols: number;
    values: Int8Array;
}

const _iterate = (rows, cols, callback) => {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            callback(row, col);
        }
    }
};

export const create = (rows: number, cols: number, init: (row: number, col: number) => number): Matrix => {
    const values = new Int8Array(rows * cols);
    const matrix = { rows, cols, values };
    iterate(matrix, (row, col) => values[row * cols + col] = init(row, col));
    return matrix;
};

export const iterate = (matrix: Matrix, callback: (row: number, col: number, value: number) => void) => {
    _iterate(matrix.rows, matrix.cols, (row, col) => callback(row, col, get(matrix, row, col)));
};

export const get = (matrix: Matrix, row: number, col: number) => {
    return matrix.values[row * matrix.cols + col];
};

export const set = (matrix: Matrix, row: number, col: number, value: number) => {
    matrix.values[row * matrix.cols + col] = value;
};

export const has = (matrix: Matrix, row, col) => row >= 0 && col >= 0 && row < matrix.rows && col < matrix.cols;

export const getCols = (matrix: Matrix) => matrix.cols;
export const getRows = (matrix: Matrix) => matrix.rows;
