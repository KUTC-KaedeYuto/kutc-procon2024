import "./App.scss";
import React, { useEffect } from "react";
import { useState } from "react";
import Container from 'react-bootstrap/Container';
import Button from "react-bootstrap/Button";
import BoardViewer from "./BoardViewer.jsx";
import TemplateViewer from "./TemplateViewer.jsx";
import { applyPattern } from "./utils.js";
import { Form } from "react-bootstrap";

const BASIC_PATTERNS = [
  {
    p: 0,
    size: {
      width: 1,
      height: 1
    },
    cells: [[1]]
  }
];

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


export default function App() {
  const [disabled, setDisabled] = useState(false);
  const [problem, setProblem] = useState(null);
  const [currentBoard, setCurrentBoard] = useState(null);

  useEffect(() => {
    console.log(problem);
    if (problem && !currentBoard) setCurrentBoard(problem.board.start);
  }, [problem]);
  useEffect(() => {
    // subscribe event
    proconApi.onProblemRespond(({ status, body }) => {
      if (status === 200) {
        body = JSON.parse(body);
        setProblem({
          board: {
            start: {
              size: {
                width: body.board.width,
                height: body.board.height
              },
              cells: body.board.start.map(l => l.split('').map(n => +n))
            },
            goal: {
              size: {
                width: body.board.width,
                height: body.board.height
              },
              cells: body.board.goal.map(l => l.split('').map(n => +n))
            }
          },
          patterns: [...BASIC_PATTERNS, ...body.general.patterns.map(pattern => {
            return {
              p: pattern.p,
              size: {
                width: pattern.width,
                height: pattern.height
              },
              cells: pattern.cells.map(l => l.split('').map(n => +n))
            }
          })]
        });
      }
      else alert(body);
      console.log(body);
      setDisabled(false);
    });
  }, []);

  return (
    <Container fluid>
      <Button variant="primary" disabled={disabled} onClick={() => {
        setDisabled(true);
        proconApi.getProblem();
      }} >問題取得</Button>
      {
        problem && currentBoard &&
        <>
          <div className="d-flex">
            <div className="me-2">
              <h2>Goal</h2>
              <BoardViewer width={500} height={500} board={problem.board.goal} />
            </div>
            <div>
              <h2 className="">Current</h2>
              <BoardViewer width={500} height={500} board={currentBoard} />
            </div>
          </div>
          抜き型一覧
          <div style={{
            display: "flex",
            overflowX: "scroll",
            overflowY: "hidden",
            width: "100%",
            height: "300px"
          }}>

            {
              problem.patterns.map(p => <TemplateViewer template={p} width={200} height={200} key={`pattern#${p.p}`} />)
            }
          </div>
          <Form>
            <Form.Label>回答出力</Form.Label>
            <Form.Control id="answerOutput"></Form.Control>
          </Form>
          <Button onClick={() => {
            // applyPattern関数はutils.js参照
            let new_board = { ...applyPattern(currentBoard, problem.patterns[11], 2, 1, 2) };
            setCurrentBoard(new_board);
          }}>テスト</Button>
          <GenerateAnswerButton problem={problem} current={currentBoard} setCurrent={setCurrentBoard} />

        </>
      }
    </Container>
  );
}

function GenerateAnswerButton({ problem, current, setCurrent }) {
  let _current;
  const pattern = problem.patterns[0];
  const goal = problem.board.goal.cells;
  const ops = [];

  const find = (x, y) => {
    const num = goal[y][x];
    console.log(`(${x} ${y})find ${num}`);
    let i = y, j = x;
    while (i < _current.cells.length) {
      if (_current.cells[i][j] === num) { console.log(`found at (${j}, ${i})`); return [j, i]; }
      j++;
      if (j >= _current.cells[i].length) {
        j = 0;
        i++;
      }
    }
    return null;
  }

  const move = (x, y, distX, distY) => {
    while (x < distX) {
      //X座標を右に持っていく
      ops.push({
        p: pattern.p,
        x: distX,
        y,
        s: 3
      });
      _current = applyPattern(_current, pattern, distX, y, 3);
      x++;
    }
    while (y > distY) {
      //Y軸でそろえる
      ops.push({
        p: pattern.p,
        x,
        y: distY,
        s: 0
      });
      _current = applyPattern(_current, pattern, x, distY, 0);
      y--;
    }
    while (x > distX) {
      ops.push({
        p: pattern.p,
        x: distX,
        y: distY,
        s: 2
      });
      _current = applyPattern(_current, pattern, distX, distY, 2);
      x--;
    }
  };

  useEffect(() => {
    _current = current;
    console.log(_current);
  }, []);

  return (<Button onClick={() => {
    for (let i = 0; i < goal.length; i++) {
      for (let j = 0; j < goal[i].length; j++) {
        const num = goal[i][j];
        if (_current.cells[i][j] === num) continue;
        let src = find(j, i);
        if (src === null) {
          alert("error");
          return;
        }
        move(src[0], src[1], j, i);
      }
    }
    console.log(ops);
    setCurrent(_current);
  }}>回答生成</Button>);
}
