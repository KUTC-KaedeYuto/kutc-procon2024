import "./App.scss";
import React, { useState, useEffect, createContext, useRef, use } from "react";
import Container from 'react-bootstrap/Container';
import Button from "react-bootstrap/Button";
import BoardViewer from "./BoardViewer.jsx";
import PatternViewer from "./PatternViewer.jsx";
import { answerScore, BASIC_PATTERNS, BoardController, boardScore, totalScore } from "./utils.js";
import BasicAnswerButton from "./buttons/BasicAnswerButton.jsx";
import { ListGroup } from "react-bootstrap";
import DPMoveButton from "./buttons/DPMoveButton.jsx";
import DPMoveButton2 from "./buttons/DPMoveButton2.jsx";

export const TargetPatternContext = createContext(null);
export const ReadFileCallbackContext = createContext(null);

export default function App() {
  const [disabled, setDisabled] = useState(false);
  const [problem, setProblem] = useState(null);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [operations, setOperations] = useState(null);
  const [targetPattern, setTargetPattern] = useState(null);
  const [submittedAnswers, setSubmittedAnswers] = useState([]);
  const controller = useRef(null);
  const [submitResponse, setSubmitResponse] = useState(null);
  const [viewMode, setViewMode] = useState("color");
  const [saveHistory, setSaveHistory] = useState(true);

  const handleResponse = ({ status, body }) => {
    console.log(`[Answer Response] Status:${status}`);
    console.log(body);
    if (status === 200) {
      body = JSON.parse(body);
      alert(`回答が受理されました(受理番号:${body.revision})`);
      setSubmittedAnswers((prev) => [...prev, {
        number: body.revision,
        controller: controller.current,
        score: {
          board: boardScore(currentBoard, problem.board.goal),
          answer: answerScore(operations)
        }
      }]);
    }
  };

  useEffect(() => {
    console.log(problem);
    if (problem) {
      setCurrentBoard(problem.board.start);
      setOperations({ n: 0, ops: [] });
      controller.current = new BoardController({
        board: problem.board.start,
        setBoard: setCurrentBoard,
        operations,
        setOperations
      });
    }
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
    proconApi.onAnswerRespond((res) => {
      setDisabled(false);
      setSubmitResponse(res);
    });
  }, []);

  useEffect(() => {
    if (submitResponse) handleResponse(submitResponse);
  }, [submitResponse]);

  return (
    <Container fluid>
      <Button variant="primary" disabled={disabled} onClick={() => {
        setDisabled(true);
        proconApi.getProblem();
      }} >問題取得&リセット</Button>
      {
        problem && currentBoard &&
        <TargetPatternContext.Provider value={{ targetPattern, setTargetPattern }}>
          <div className="d-flex">
            <div className="me-2">
              <h2>ゴール</h2>
              <BoardViewer width={500} height={500} board={problem.board.goal} viewMode={viewMode} />
            </div>
            <div className="me-2">
              <h2>現在のボード</h2>
              <BoardViewer width={500} height={500} board={currentBoard} editable controller={controller.current} viewMode={viewMode} />
            </div>
            <div>
              <h2>抜き型一覧</h2>
              <div className="d-flex flex-wrap" style={{
                backgroundColor: "#eee",
                overflowY: "scroll",
                width: "500px",
                height: "500px"
              }}>

                {
                  problem.patterns.map(p => <PatternViewer pattern={p} width={200} height={200} key={`pattern#${p.p}`} />)
                }
              </div>
            </div>
            <div style={{
              width: "max-content"
            }}>
              <Container fluid className="me-4">
                <h2>スコア</h2>
                <Container style={{
                  fontSize: "120%"
                }}>
                  <div>
                    ボード: {
                      (() => {
                        const score = boardScore(currentBoard, problem.board.goal);
                        return `${score.correct}/${score.all}(${Math.round(score.accuracy * 10000) / 100}%)`;
                      })()
                    }
                  </div>
                  <div>
                    手数: {Math.round(answerScore(operations) * 100) / 100}
                  </div>
                  <div>
                    総合: {
                      totalScore(boardScore(currentBoard, problem.board.goal), answerScore(operations))
                    }
                  </div>
                </Container>
              </Container>
              <Container fluid>
                <h2>提出済み回答</h2>
                <ListGroup>
                  {
                    submittedAnswers.map(ans => <AnswerViewer answer={ans}
                      key={`answer#${ans.number}`}
                      setController={(c) => {
                        controller.current = c;
                        controller.current.update();
                      }}
                    />)
                  }
                </ListGroup>
              </Container>
            </div>
          </div>

          <Container fluid className="mt-2">
            <div className="me-2 ps-2 d-inline-block">
              <div>基本回答</div>
              <BasicAnswerButton problem={problem} controller={controller.current} />
            </div>

            <div className="me-2 ps-2 d-inline-block">
              <div>改良型</div>
              <DPMoveButton problem={problem} controller={controller.current} />
            </div>
            <div className="me-2 ps-2 d-inline-block">
              <div>改良型V2</div>
              <DPMoveButton2 problem={problem} controller={controller.current} />
            </div>
            
            <Button variant="secondary" onClick={() => {
              setViewMode(viewMode === "color" ? "number" : "color");
            }} className="me-2" >表示変更</Button>
            <Button variant="secondary" onClick={() => {
              controller.current.update();
            }} className="me-2" >アップデート</Button>
            <div className="me-2 ps-2 d-inline-block">
              <div>履歴の保存</div>
              <Button variant={saveHistory ? "primary" : "outline-primary"} onClick={() => {
                setSaveHistory(!saveHistory);
                controller.current.saveHistory = saveHistory;
              }}>{
                saveHistory ? "有効": "無効"
              }</Button>
            </div>
            <Button onClick={() => {
              controller.current.undo();
              controller.current.update();
            }} className="me-2" disabled={!saveHistory} >Undo</Button>
            <Button variant="warning" onClick={() => {
              setDisabled(true);
              proconApi.submitAnswer(operations);
            }} >提出</Button>
          </Container>
          <Container fluid className="mt-2">
            <h4>回答出力</h4>
            <div>
              {
                (() => {
                  const result = JSON.stringify(operations);
                  if (result.length >= 10000) return result.substring(0, 10000) + "...";
                  return result;
                })()
              }
            </div>
          </Container>
        </TargetPatternContext.Provider>
      }
    </Container>
  );
}

function AnswerViewer({ answer, setController }) {
  return (<ListGroup.Item >
    No.{answer.number} スコア: {totalScore(answer.score.board, answer.score.answer)}
    <Button variant="secondary" onClick={() => {
      console.log(answer.controller);
      setController(answer.controller);
    }}>復元</Button>
  </ListGroup.Item>);
}
