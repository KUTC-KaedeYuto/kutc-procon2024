import React, { useContext, useEffect, useRef, useState } from "react";
import { TargetPatternContext } from "./App.jsx";


export default function PatternViewer({ pattern, width, height }) {
  const canvas_ref = useRef();
  const { setTargetPattern } = useContext(TargetPatternContext);
  const [cellSize, setCellSize] = useState(Math.max(3, (Math.min(Math.floor(width / pattern.size.width), Math.floor(height / pattern.size.height)))));

  const draw = () => {
    const canvas = canvas_ref.current;
    const ctx = canvas.getContext('2d');

    const b_width = pattern.size.width, b_height = pattern.size.height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();


    for (let i = 0; i < b_height; i++) {
      for (let j = 0; j < b_width; j++) {
        ctx.fillStyle = pattern.cells[i][j] === 0 ? "#fff" :"#000";
        ctx.fillRect(cellSize * j, cellSize * i, cellSize, cellSize);
      }
    }
    ctx.strokeStyle = "#444";
    for (let i = 0; i <= b_height; i++) {
      ctx.beginPath();
      ctx.moveTo(0, cellSize * i);
      ctx.lineTo(cellSize * b_width, cellSize * i);
      ctx.stroke();
    }
    for (let i = 0; i <= b_width; i++) {
      ctx.beginPath();
      ctx.moveTo(cellSize * i, 0);
      ctx.lineTo(cellSize * i, cellSize * b_height);
      ctx.stroke();
    }

    ctx.restore();
  };


  useEffect(() => {
    draw();
  }, []);

  return (
    <div
      className="m-3"
      style={{
        width: `${width}px`,
        height: `${height}px`
      }}
      onClick={() => {
        setTargetPattern(pattern);
      }}
    >
      {pattern.p}
      <canvas ref={canvas_ref} width={width} height={height}></canvas>
    </div>
  );
}