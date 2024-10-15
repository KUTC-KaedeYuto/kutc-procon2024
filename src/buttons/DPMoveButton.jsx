import React, { useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import { DIR } from "../utils";

const powers = new Array(9).fill(0)
  .map((_n, i) => 2 ** i);

export default function DPMoveButton({ problem, controller }) {
  const goal = problem.board.goal.cells;
  const dp = useRef(null);
  const prev = useRef(null);
  const [disabled, setDisabled] = useState(false);

  const getPatternNumber = (d) => {
    if (d === 1) return 0;
    return 3 * Math.floor(Math.log2(d) - 1) + 1;
  }

  const getPattern = n => problem.patterns[getPatternNumber(n)];

  const find = (x, y) => {
    const num = goal[y][x];
    let i = y, j = x;
    while (i < controller.board.cells.length) {
      if (controller.board.cells[i][j] === num) return [j, i];
      j++;
      if (j >= controller.board.cells[i].length) {
        j = 0;
        i++;
      }
    }
    return null;
  }

  const move = async (x, y, distX, distY) => {
    //X座標を右に持っていく
    let steps = generateSteps(x, distX - x, true);
    while (x < distX) {
      const [prev, operation] = steps.pop();
      const pattern = getPattern(Math.abs(operation));
      if (operation > 0) {
        // 右に移動
        await controller.applyPattern(pattern, x + 1, y, DIR.RIGHT);
      } else {
        // 左に移動
        await controller.applyPattern(pattern, x + operation, y, DIR.LEFT);
      }
      x += operation;
    }
    steps = generateSteps(y, y - distY, true);
    while (y > distY) {
      //Y軸でそろえる
      const [prev, operation] = steps.pop();
      const pattern = getPattern(Math.abs(operation));
      await controller.applyPattern(pattern, x, distY, DIR.UP);
      y -= operation;
    }
    steps = generateSteps(x, x - distX, true);
    while (x > distX) {
      const [prev, operation] = steps.pop();
      const pattern = getPattern(Math.abs(operation));
      await controller.applyPattern(pattern, distX, distY, DIR.LEFT);
      x -= operation;
    }
  };

  const calculateDP = (dp_max) => {
    dp.current = new Array(dp_max + 1).fill(0).map(() => new Array(dp_max + 1).fill(Infinity));

    // 初期条件の設定
    for (let i = 0; i <= dp_max; i++) {
      dp.current[i][0] = 0;
    }
    prev.current = new Array(dp_max + 1).fill(0).map(() => new Array(dp_max + 1).fill(null));
    for (let i = 0; i <= dp_max; i++) { // 動かす前の座標
      for (let j = 0; j <= dp_max; j++) { // 動かす量
        for (const p of powers) {
          // 減算の回数最適化
          if (j - p >= 0) {
            if (dp.current[i][j] + 1 < dp.current[i][j - p]) {
              dp.current[i][j - p] = dp.current[i][j] + 1;
              prev.current[i][j - p] = [j, -p];
            }
          }

          // 加算の回数最適化
          if (j + p <= dp_max) {
            if (dp.current[i][j] + 1 < dp.current[i][j + p]) {
              dp.current[i][j + p] = dp.current[i][j] + 1;
              prev.current[i][j + p] = [j, p];
            }
          }
        }
      }
    }
  };

  const generateSteps = (start, distance, secure = false) => {
    const steps = [];
    let current = distance;

    const generateBasicSteps = (n) => {
      const result = [];
      let a = 0, b = 1;
      while (n > 0) {
        if (n % 2 == 1) {
          result.push([a, b]);
          a += b;
        }
        b *= 2;
        n = Math.floor(n / 2);
      }
      return result;
    };

    if (secure) return generateBasicSteps(distance);

    while (current !== 0) {
      const prevState = prev.current[start][current];
      if (!prevState) break;
      const [prevAmount, operation] = prevState;
      steps.push([prevAmount, operation]);
      current = prevAmount;
    }
    steps.reverse();
    return steps;
  };

  const run = async () => {
    for (let i = 0; i < goal.length; i++) {
      for (let j = 0; j < goal[i].length; j++) {
        const num = goal[i][j];
        if (controller.board.cells[i][j] === num) continue;
        let src = find(j, i);
        if (src === null) {
          alert("error");
          return;
        }
        await move(src[0], src[1], j, i);
      }
    }
  }

  return (<Button className="me-2" disabled={disabled} onClick={async () => {
    setDisabled(true);
    calculateDP(controller.board.size.width);

    const start = performance.now();
    run().then(() => {
      controller.update();
      setDisabled(false);
      console.log(`Process ends in ${performance.now() - start}ms`);
    });
  }}>回答生成</Button>);
}
