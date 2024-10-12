import React, { useContext, useEffect } from "react";
import Button from "react-bootstrap/Button";
import { DIR } from "../utils";

export default function BasicAnswerButton({ problem, controller }) {
  const pattern = problem.patterns[0];
  const goal = problem.board.goal.cells;

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

  const move = (x, y, distX, distY) => {
    while (x < distX) {
      //X座標を右に持っていく
      controller.applyPattern(pattern, distX, y, DIR.RIGHT);
      x++;
    }
    while (y > distY) {
      //Y軸でそろえる
      controller.applyPattern(pattern, x, distY, DIR.UP);
      y--;
    }
    while (x > distX) {
      controller.applyPattern(pattern, distX, distY, DIR.LEFT);
      x--;
    }
  };

  return (<Button className="me-2" onClick={() => {
    for (let i = 0; i < goal.length; i++) {
      for (let j = 0; j < goal[i].length; j++) {
        const num = goal[i][j];
        if (controller.board.cells[i][j] === num) continue;
        let src = find(j, i);
        if (src === null) {
          alert("error");
          return;
        }
        move(src[0], src[1], j, i);
      }
    }
    controller.update();
  }}>回答生成</Button>);
}
