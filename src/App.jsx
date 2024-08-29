import "./App.scss";
import React, { useEffect } from "react";
import { useState } from "react";
import Container from 'react-bootstrap/Container';
import Button from "react-bootstrap/Button";
import BoardViewer from "./BoardViewer.jsx";
import TemplateViewer from "./TemplateViewer.jsx";
import { applyPattern } from "./utils.js";

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
          <h2>Goal</h2>
          <BoardViewer width={500} height={500} board={problem.board.goal} />
          <h2>Current</h2>
          <BoardViewer width={500} height={500} board={currentBoard} />
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
          <Button onClick={() => {
            // applyPattern関数はutils.js参照
            let new_board = { ...applyPattern(currentBoard, problem.patterns[11], 2, 1, 2) };
            setCurrentBoard(new_board);
          }}>テスト</Button>

        </>
      }
    </Container>
  );
}



