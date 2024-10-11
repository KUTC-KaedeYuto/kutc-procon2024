import "./App.scss";
import React, { useState, useEffect, createContext } from "react";
import Container from 'react-bootstrap/Container';
import Button from "react-bootstrap/Button";
import BoardViewer from "./BoardViewer.jsx";
import PatternViewer from "./PatternViewer.jsx";
import { applyPattern, BoardController, DIR } from "./utils.js";
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

export const TargetPatternContext = createContext(null);

export default function App() {
  const [disabled, setDisabled] = useState(false);
  const [problem, setProblem] = useState(null);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [targetPattern, setTargetPattern] = useState(null);

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

  useEffect(() => {
    console.log(targetPattern);
  }, [targetPattern]);

  return (
    <Container fluid>
      <Button variant="primary" disabled={disabled} onClick={() => {
        setDisabled(true);
        proconApi.getProblem();
      }} >問題取得</Button>
      {
        problem && currentBoard &&
        <TargetPatternContext.Provider value={{targetPattern, setTargetPattern}}>
          <div className="d-flex">
            <div className="me-2">
              <h2>Goal</h2>
              <BoardViewer width={500} height={500} board={problem.board.goal} />
            </div>
            <div>
              <h2 className="">Current</h2>
              <BoardViewer width={500} height={500} board={currentBoard} editable />
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
              problem.patterns.map(p => <PatternViewer pattern={p} width={200} height={200} key={`pattern#${p.p}`} />)
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

        </TargetPatternContext.Provider>
      }
    </Container>
  );
}

function GenerateAnswerButton({ problem, current, setCurrent }) {
  let _current;
  const pattern = problem.patterns[0];
  const goal = problem.board.goal.cells;

  const find = (x, y) => {
    const num = goal[y][x];
    let i = y, j = x;
    while (i < _current.cells.length) {
      if (_current.cells[i][j] === num) return [j, i];
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
      _current.applyPattern(pattern, distX, y, DIR.RIGHT);
      x++;
    }
    while (y > distY) {
      //Y軸でそろえる
      _current.applyPattern(pattern, x, distY, DIR.UP);
      y--;
    }
    while (x > distX) {
      _current.applyPattern(pattern, distX, distY, DIR.LEFT);
      x--;
    }
  };

  useEffect(() => {
    _current = new BoardController(current);
    console.log(_current.board);
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
    console.log(_current.operations);
    setCurrent(_current.board);
  }}>回答生成</Button>);
}
