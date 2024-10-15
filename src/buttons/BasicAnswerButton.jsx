import React, { useContext, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import { DIR } from "../utils";

export default function BasicAnswerButton({ problem, controller }) {
  const pattern = problem.patterns[0];
  const goal = problem.board.goal.cells;
  const [disabled, setDisabled] = useState(false);

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
    while (x < distX) {
      //X座標を右に持っていく
      await controller.applyPattern(pattern, distX, y, DIR.RIGHT);
      x++;
    }
    while (y > distY) {
      //Y軸でそろえる
      await controller.applyPattern(pattern, x, distY, DIR.UP);
      y--;
    }
    while (x > distX) {
      await controller.applyPattern(pattern, distX, distY, DIR.LEFT);
      x--;
    }
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
    const start = performance.now();
    run().then(() => {
      controller.update();
      console.log(`Process ends in ${performance.now() - start}ms`);
      setDisabled(false);
    });
  }}>回答生成</Button>);
}
