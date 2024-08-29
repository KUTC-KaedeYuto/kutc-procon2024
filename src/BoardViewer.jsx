import React, { useEffect, useRef, useState } from "react";

const offsetRate = 0.05;

export default function BoardViewer({width, height, board}){
    const canvas_ref = useRef();
    const [cellSize, setCellSize] = useState(50);

    function draw(){
        const canvas = canvas_ref.current;
        const ctx = canvas.getContext('2d');
        const offset_x = width * offsetRate;
        const offset_y = height * offsetRate;
        const b_width = board.size.width, b_height = board.size.height;
        
        ctx.save();
        ctx.fillStyle = "#444";
        ctx.fillRect(0, 0, width, height);
        ctx.translate(offset_x, offset_y);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, cellSize * b_width, cellSize * b_height);
        ctx.strokeStyle = "#000";
        for(let i = 0; i <= b_height; i++){
            ctx.beginPath();
            ctx.moveTo(0, cellSize * i);
            ctx.lineTo(cellSize * b_width, cellSize * i);
            ctx.stroke();
        }
        for(let i = 0; i <= b_width; i++){
            ctx.beginPath();
            ctx.moveTo(cellSize * i, 0);
            ctx.lineTo(cellSize * i, cellSize * b_height);
            ctx.stroke();
        }
        ctx.fillStyle = "#000"
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${parseInt(cellSize * 0.75)}px sansserif`;
        for(let i = 0; i < b_height; i++){
            for(let j = 0; j < b_width; j++){
                ctx.fillText(board.cells[i][j], cellSize * (j + 0.5), cellSize * (i + 0.5));
            }
        }
        
        ctx.restore();
    }

    useEffect(() => {
        draw();
    }, [board]);
    return(
        <div style={{
            width: `${width}px`,
            height: `${height}px`
        }}>
            <canvas ref={canvas_ref} width={width} height={height}></canvas>
        </div>
    );
}