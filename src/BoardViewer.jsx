import React, { useEffect, useRef, useState } from "react";

const offsetRate = 0.05;

export default function BoardViewer({ width, height, board }) {
    const canvas_ref = useRef();
    const [cellSize, setCellSize] = useState(50);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: width * offsetRate, y: height * offsetRate });
    const mouseDown = useRef(false);
    const prevMousePos = useRef([0, 0]);

    const draw = () => {
        const canvas = canvas_ref.current;
        const ctx = canvas.getContext('2d');
        const b_width = board.size.width, b_height = board.size.height;

        ctx.save();
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#777";
        ctx.fillRect(0, 0, width, height);

        ctx.scale(zoom, zoom);
        ctx.fillStyle = "#fff";
        ctx.fillRect(offset.x, offset.y, cellSize * b_width, cellSize * b_height);
        ctx.strokeStyle = "#000";
        for (let i = offset.y % cellSize; i <= height / zoom; i += cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width / zoom, i);
            ctx.stroke();
        }
        for (let i = offset.x % cellSize; i <= width / zoom; i += cellSize) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height / zoom);
            ctx.stroke();
        }
        ctx.translate(offset.x, offset.y);
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
        const zoomAmount = 0.1;
        setZoom(prevZoom => Math.max(0.1, prevZoom + (e.deltaY > 0 ? -zoomAmount : zoomAmount)));
    };

    const handleMouseDown = (e) => {
        mouseDown.current = true;
        prevMousePos.current = [e.clientX, e.clientY];
    };

    const handleMouseMove = (e) => {
        if (!mouseDown.current) return;
        const dx = e.clientX - prevMousePos.current[0];
        const dy = e.clientY - prevMousePos.current[1];
        setOffset(prevOffset => ({
            x: prevOffset.x + dx / zoom,
            y: prevOffset.y + dy / zoom
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
            setOffset({ x: width * offsetRate, y: height * offsetRate });
        }
    };

    useEffect(() => {
        draw();
    }, [board, zoom, offset]);

    useEffect(() => {
        const canvas = canvas_ref.current;
        const scrollBlock = (e) => {e.preventDefault()};
        canvas.addEventListener('wheel', scrollBlock, { passive: false });

        return () => {
            canvas.removeEventListener('wheel', scrollBlock);
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
            <canvas ref={canvas_ref}
                tabIndex={-1}
                width={width}
                height={height}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onKeyDown={handleKeyDown}
            ></canvas>
        </div>
    );
}
