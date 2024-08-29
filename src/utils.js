//抜き型を適用する関数
// board: 適用するボード
// pattern: 適用する抜き型
// x, y: 抜き型を適用する際の左上の座標
// dir: 方向
export function applyPattern(board, pattern, x, y, dir) {
    // dir: 方向(0: 上, 1: 下, 2: 左, 3: 右)
    let [ox, oy, masked_pattern] = maskPattern(board, pattern, x, y);
    return shiftCells(board, dir, masked_pattern, ox, oy);
  }
  
  //抜き型をボードの範囲内に収まるようにリサイズする関数
  function maskPattern(board, pattern, x, y) {
    let masked_pattern = structuredClone(pattern);
    if (x < 0) {
      //サイズの変更
      masked_pattern.size.width += x;
      //抜き型の変更
      masked_pattern.cells.map((line) => {
        line.splice(0, -x);
      });
      //適用座標の変更
      x = 0;
    }
    if (y < 0) {
      masked_pattern.size.height += y;
      masked_pattern.cells.splice(0, -y);
      y = 0;
    }
  
    if (x + masked_pattern.size.width > board.size.width) {
      masked_pattern.size.width = board.size.width - x;
      masked_pattern.cells.map(line => {
        line.splice(board.size.width - x, line.length);
      });
    }
    if (y + masked_pattern.size.height > board.size.height) {
      masked_pattern.size.height = board.size.height - y;
      masked_pattern.cells.splice(board.size.height - y, masked_pattern.cells.length);
    }
  
    return [x, y, masked_pattern];
  }
  
  //抜き型を適用したときのマスの移動を計算する関数
  function shiftCells(board, dir, pattern, x, y) {
    console.log("--shiftCells--");
    // _dir == 0 -> vertical, _dir == 1 -> horizontal
    const _dir = Math.floor(dir / 2);
    const length = _dir === 0 ? pattern.size.width : pattern.size.height;
    const movingCells = new Array(length).fill(0).map((i) => new Array());
  
    // 転置処理
    const transpose = (matrix) => {
      return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    };
  
    // 元の配列を取得
    let cells = board.cells.map(row => row.slice());
    let pattern_cells = pattern.cells.map(row => row.slice());
  
    console.log(x, y, cells, pattern_cells);
    // 転置処理（縦方向シフト時のみ）
    if (_dir === 0) {
      cells = transpose(cells);
      pattern_cells = transpose(pattern_cells);
      let temp = x;
      x = y;
      y = temp;
    }
    
    console.log(x, y, cells, pattern_cells);
  
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
    console.log(cells, movingCells);
  
    // シフト操作
    for (let i = 0; i < movingCells.length; i++) {
      let row = cells[y + i];
      if (dir % 2 === 0) {
        // 上方向または左方向
        cells[y + i] = movingCells[i].concat(row);
      } else {
        // 下方向または右方向
        cells[y + i] = row.concat(movingCells[i]);
      }
    }
  
    // 転置処理を元に戻す（縦方向シフト時のみ）
    if (_dir === 0) {
      cells = transpose(cells);
    }
  
    // 結果を board.cells に反映
    board.cells = cells;
    console.log("result");
    console.log(cells);
    return board;
  }