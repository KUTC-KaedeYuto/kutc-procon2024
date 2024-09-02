import React, { useEffect, useRef, useState } from "react";

const offsetRate = 0.05;

export default function BoardViewer({ width, height, board }) {
    const canvas_ref = useRef();
    const [cellSize, setCellSize] = useState(50);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const mouseDown = useRef(false);
    const prevMousePos = useRef([0, 0]);

    const draw = () => {
        const canvas = canvas_ref.current;
        const ctx = canvas.getContext('2d');
        const offset_x = width * offsetRate;
        const offset_y = height * offsetRate;
        const b_width = board.size.width, b_height = board.size.height;

        ctx.save();
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#444";
        ctx.fillRect(0, 0, width, height);
        ctx.translate(offset.x, offset.y);
        ctx.translate(offset_x, offset_y);
        ctx.scale(zoom, zoom);

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, cellSize * b_width, cellSize * b_height);
        ctx.strokeStyle = "#000";
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
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${parseInt(cellSize * 0.75)}px sansserif`;
        for (let i = 0; i < b_height; i++) {
            for (let j = 0; j < b_width; j++) {
                ctx.fillText(board.cells[i][j], cellSize * (j + 0.5), cellSize * (i + 0.5));
            }
        }

        ctx.restore();
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const zoomAmount = 0.1;
        setZoom(prevZoom => Math.max(0.1, prevZoom + (e.deltaY > 0 ? -zoomAmount : zoomAmount)));
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        mouseDown.current = true;
        prevMousePos.current = [e.clientX, e.clientY];
    };

    const handleMouseMove = (e) => {
        if(!mouseDown.current) return;
        const dx = e.clientX - prevMousePos.current[0];
        const dy = e.clientY - prevMousePos.current[1];
        setOffset(prevOffset => ({
            x: prevOffset.x + dx,
            y: prevOffset.y + dy
        }));
        prevMousePos.current = [e.clientX, e.clientY];
    };

    const handleMouseUp = () => {
        mouseDown.current = false;
    };

    const handleKeyDown = (e) => {
        if (mouseDown.current && (e.key === 'r' || e.key === 'R')) {
            e.preventDefault();
            setZoom(1);
            setOffset({ x: 0, y: 0 });
        }
    };

    useEffect(() => {
        draw();
    }, [board, zoom, offset]);

    useEffect(() => {
        const canvas = canvas_ref.current;
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            canvas.removeEventListener('wheel', handleWheel);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <div
            style={{
                width: `${width}px`,
                height: `${height}px`,
                overflow: "hidden",
                position: 'relative',
                touchAction: 'none'
            }}
        >
            <canvas ref={canvas_ref} width={width} height={height}></canvas>
        </div>
    );
}
