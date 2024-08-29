import React, { useEffect, useRef, useState } from "react";


export default function TemplateViewer({ template, width, height }) {
    const canvas_ref = useRef();
    const [cellSize, setCellSize] = useState(Math.max(3, (Math.min(Math.floor(width / template.size.width), Math.floor(height / template.size.height)))));

    const draw = () => {
        const canvas = canvas_ref.current;
        const ctx = canvas.getContext('2d');

        const b_width = template.size.width, b_height = template.size.height;
        
        ctx.clearRect(0, 0, width, height);
        ctx.save();

        ctx.fillStyle = "#000";
        for(let i = 0; i < b_height; i++){
            for(let j = 0; j < b_width; j++){
                if(template.cells[i][j] !== 0){
                    ctx.fillRect(cellSize * j, cellSize * i, cellSize, cellSize);
                }
            }
        }
        ctx.strokeStyle = "#444";
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

        ctx.restore();
    };


    useEffect(() => {
        draw();
    }, []);

    return (
        <div className="m-3" style={{
            width: `${width}px`,
            height: `${height}px`
        }}>
            {template.p}
            <canvas ref={canvas_ref} width={width} height={height}></canvas>
        </div>
    );
}