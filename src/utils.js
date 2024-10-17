export const BASIC_PATTERNS = [
  {
    p: 0,
    size: {
      width: 1,
      height: 1
    },
    cells: [[1]]
  }
];

const MAX_ITERATIONS = 100;
let iteration = 0;

const cellValue = (type, x, y) => {
  if (type === 0) return 1
  if (type === 1) return (y + 1) % 2;
  return (x + 1) % 2;
};

for (let i = 2; i <= 256; i *= 2) {
  for (let j = 0; j < 3; j++) {
    BASIC_PATTERNS.push(
      {
        p: BASIC_PATTERNS.length,
        size: {
          width: i,
          height: i
        },
        cells: new Array(i).fill(0).map((_n, k) => new Array(i).fill(0).map((_m, l) => cellValue(j, l, k)))
      }
    );
  }
}


//抜き型を適用する関数
// board: 適用するボード
// pattern: 適用する抜き型
// x, y: 抜き型を適用する際の左上の座標
// dir: 方向
export async function applyPattern(board, pattern, x, y, dir) {
  // dir: 方向(0: 上, 1: 下, 2: 左, 3: 右)
  let temp = structuredClone(pattern);
  let [ox, oy, masked_pattern] = maskPattern(board, temp, x, y);
  if (masked_pattern.size.width <= 0 || masked_pattern.size.height <= 0) throw new InvalidOperationException(board, pattern, x, y);
  await shiftCells(board, dir, masked_pattern, ox, oy);
}

//抜き型をボードの範囲内に収まるようにリサイズする関数
function maskPattern(board, pattern, x, y) {
  if (x < 0) {
    //サイズの変更
    pattern.size.width += x;
    //抜き型の変更
    pattern.cells.map((line) => {
      line.splice(0, -x);
    });
    //適用座標の変更
    x = 0;
  }
  if (y < 0) {
    pattern.size.height += y;
    pattern.cells.splice(0, -y);
    y = 0;
  }

  if (x + pattern.size.width > board.size.width) {
    pattern.size.width = Math.max(0, board.size.width - x);
    pattern.cells.map(line => {
      line.splice(board.size.width - x, line.length);
    });
  }
  if (y + pattern.size.height > board.size.height) {
    pattern.size.height = Math.max(0, board.size.height - y);
    pattern.cells.splice(board.size.height - y, pattern.cells.length);
  }

  return [x, y, pattern];
}

//抜き型を適用したときのマスの移動を計算する関数
async function shiftCells(board, dir, pattern, x, y) {
  if (iteration++ >= MAX_ITERATIONS) {
    iteration = 0;
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 0);
    });
  }
  // _dir == 0 -> vertical, _dir == 1 -> horizontal
  const _dir = Math.floor(dir / 2);
  const length = _dir === 0 ? pattern.size.width : pattern.size.height;
  const movingCells = new Array(length).fill(0).map((i) => new Array());

  // 転置処理
  const transpose = async (matrix) => {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  };

  // 元の配列を取得
  let cells = board.cells;
  let pattern_cells = pattern.cells;

  // 転置処理（縦方向シフト時のみ）
  if (_dir === 0) {
    cells = await transpose(cells);
    pattern_cells = await transpose(pattern_cells);
    let temp = x;
    x = y;
    y = temp;
  }

  // 移動対象のセルを取得
  for (let i = 0; i < pattern_cells.length; i++) {
    for (let j = 0; j < pattern_cells[i].length; j++) {
      if (pattern_cells[i][j] === 1) {
        movingCells[i].push(cells[y + i].splice(x + j, 1)[0]);
        pattern_cells[i].splice(j, 1);
        j--;
      }
    }
  }

  // シフト操作
  for (let i = 0; i < movingCells.length; i++) {
    let row = cells[y + i];
    if (dir % 2 === 0) {
      // 上方向または左方向
      cells[y + i] = row.concat(movingCells[i]);
    } else {
      // 下方向または右方向
      cells[y + i] = movingCells[i].concat(row);
    }
  }

  // 転置処理を元に戻す（縦方向シフト時のみ）
  if (_dir === 0) {
    cells = await transpose(cells);
  }

  board.cells = cells;
}

export class BoardController {
  #init_board;
  #board;
  #operations;
  #history;
  #state;
  #lockUndo;
  saveHistory;

  constructor({ board, setBoard, operations, setOperations }) {
    this.#init_board = board;
    this.#state = {
      board,
      setBoard,
      operations,
      setOperations
    };
    this.reset();
    this.#lockUndo = false;
    this.saveHistory = true;
  }

  get board() {
    return this.#board;
  }

  get operations() {
    return this.#operations;
  }

  get cells() {
    return this.#board.cells;
  }

  get size() {
    return this.#board.size;
  }

  #pushHistory() {
    if (this.#history.length >= 100) {
      let writeContent = ``;
      this.#history.map((b) => {
        const arr = encodeBoard(b.cells);
        writeContent += `${toBase64(arr)}\n`;
      });
      const file_name = `${Math.floor(this.#operations.length / 100)}.txt`;
      FileWriter.write(file_name, writeContent);
      this.#history = [];
    }
    this.#history.push(structuredClone(this.#board));
    
  }

  reset() {
    this.resetBoard();
    this.resetOperations();
  }

  resetBoard() {
    this.#board = this.#init_board;
    this.#history = [];
  }

  resetOperations() {
    this.#operations = [];
  }

  async applyPattern(pattern, x, y, dir) {
    try {
      // this.#pushHistory();
      await applyPattern(this.#board, pattern, x, y, dir);
      this.#operations.push({
        p: pattern.p,
        x,
        y,
        s: dir
      });
    } catch (e) {
      console.error(e);
    }
  }

  reBuildBoard() {
    this.#board = this.#history.pop();
    if (this.#history.length === 0 && this.#operations.length > 100) {
      this.#lockUndo = true;
      const file_name = `${Math.floor((this.#operations.length - 1) / 100)}.txt`;
      FileReader.read(file_name, (data) => {
        const size = this.#board.size;
        this.#history = data.trimEnd().split("\n").map((line) => {
          return {
            size,
            cells: decodeBoard(toArray(line), size.width, size.height)
          }
        });
        this.#lockUndo = false;
      });
    }
  }

  undo() {
    while (this.#lockUndo) { }
    if (this.#operations.length === 0) return null;
    this.reBuildBoard();
    return this.#operations.pop();
  }

  update() {
    this.#state.setBoard(structuredClone(this.#board));
    this.#state.setOperations({
      n: this.#operations.length,
      ops: this.#operations
    });
  }

}

export class InvalidOperationException extends Error {
  constructor(board, pattern, x, y) {
    super(`The operation originating from (${x}, ${y}) using pattern [No.${pattern.p}] on a ${board.size.width}x${board.size.height} board is invalid`);
  }
}


export const DIR = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3
};

export function boardScore(board, goal) {
  const cells = board.cells;
  const goal_cells = goal.cells;
  const all = cells.length * cells[0].length
  let n = 0;
  for (let i = 0; i < cells.length; i++) {
    for (let j = 0; j < cells[i].length; j++) {
      if (cells[i][j] === goal_cells[i][j]) n++;
    }
  }
  return {
    all,
    correct: n,
    incorrect: all - n,
    accuracy: n / all
  };
}

export function answerScore(ans) {
  const b = 10000, a = -0.001;
  return b * Math.pow(Math.E, a * ans.n);
}

export function totalScore(board_score, answer_score) {
  return Math.round((board_score.correct * 100000 + answer_score) * 100) / 100;
}

class FileReader {
  static #id;
  static #callbacks;

  static {
    this.#id = 0;
    this.#callbacks = {};
    fileApi.receive((data) => {
      this.#handleReadFile(data);
    });
  }

  static read(file_name, callback) {
    const new_id = `${this.#id++}`;
    this.#callbacks[new_id] = callback;
    fileApi.read(new_id, file_name);
  }

  static #handleReadFile(data) {
    if (data.status === "success") {
      const id = data.data.id;
      if (Object.keys(this.#callbacks).includes("" + id)) {
        this.#callbacks[id](data.data.value);
      }
    } else {
      console.log(data.data.value);
    }
  }
}

class FileWriter {
  static write(file_name, data) {
    fileApi.write(file_name, data);
  }
}

function encodeBoard(cells) {
  const result = new Uint8Array((cells.length * cells[0].length) / 4);
  let index = 0;
  let n = 0;
  let k = 0;
  for (let i = 0; i < cells.length; i++) {
    for (let j = 0; j < cells[i].length; j++) {
      n |= (cells[i][j] & 0b11) << (6 - k++ * 2);
      if (k >= 4) {
        result[index++] = n;
        n = 0;
        k = 0;
      }
    }
  }
  if (n != 0) result[index] = n;
  return result;
}

function decodeBoard(arr, width, height) {
  const result = Array.from({ length: height }, () => Array(width).fill(0));
  let index = 0;
  let n = 0;
  let k = 0;

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      if (k === 0) {
        n = arr[index++];
      }
      // 6 - k * 2を使って上位ビットから順に取り出す
      const value = (n >> (6 - k * 2)) & 0b11;
      result[i][j] = value;
      k++;
      if (k >= 4) {
        k = 0;
      }
    }
  }
  console.log(result);
  return result;
}

function toBase64(uint8Array) {
  return btoa(String.fromCharCode(...uint8Array));
}

function toArray(base64Text) {
  const binaryString = atob(base64Text);
  const length = binaryString.length;
  const uint8Array = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  return uint8Array;
}

