import React, { useContext, useEffect, useRef, useState } from "react";
import { TargetPatternContext } from "./App.jsx";

const offsetRate = 0.05;

export default function BoardViewer({ width, height, board, editable = false }) {
    const canvas_ref = useRef();
    const [cellSize, setCellSize] = useState(50);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: width * offsetRate, y: height * offsetRate });
    const { targetPattern, setTargetPattern } = useContext(TargetPatternContext);
    const mouseDown = useRef(false);
    const prevMousePos = useRef([0, 0]);
    const [onCursor, setOnCursor] = useState(false);
    const [placingPattern, setPlacingPattern] = useState(null);
    const getDir = (t) => {
        if(t <= - Math.PI * 0.75) return 2;
        if(t <= - Math.PI * 0.25) return 3;
        if(t <= Math.PI * 0.25) return 0;
        if(t <= Math.PI * 0.75) return 1;
        return 2;
    };

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

        if (!editable) return;
        const renderPattern = (x, y, cells) => {
            for (let i = 0; i < cells.length; i++) {
                for (let j = 0; j < cells[i].length; j++) {
                    let dist = {
                        x: x + j,
                        y: y + i
                    };
                    if (cells[i][j] === 0) continue;
                    ctx.fillRect(cellSize * dist.x, cellSize * dist.y, cellSize, cellSize);
                }
            }
        }
        ctx.save();
        ctx.save();
        ctx.scale(zoom, zoom);
        ctx.translate(offset.x, offset.y);
        if (onCursor && targetPattern) {
            const origin = {
                x: Math.floor((prevMousePos.current[0] / zoom - offset.x) / cellSize),
                y: Math.floor((prevMousePos.current[1] / zoom - offset.y) / cellSize)
            };
            const pattern_cells = targetPattern.cells;
            ctx.fillStyle = "rgba(0, 255, 0, 50%)";
            renderPattern(origin.x, origin.y, pattern_cells);
        }

        if (placingPattern != null) {
            const origin = placingPattern.pos;
            const pattern_cells = placingPattern.pattern.cells;
            ctx.fillStyle = "rgba(0, 200, 0, 50%)";
            renderPattern(origin.x, origin.y, pattern_cells);
            ctx.restore();
            const drawTriangle = (x, y, dir) => {
                const t_delta = height / 10;
                const getMatrix = (theta, dx, dy) => [
                    [Math.cos(theta), -Math.sin(theta), dx],
                    [Math.sin(theta), Math.cos(theta), dy],
                    [0, 0, 1]];
                const applyMatrix = (mat, vec) => {
                    return [mat[0][0] * vec[0] + mat[0][1] * vec[1] + mat[0][2] * vec[2],
                    mat[1][0] * vec[0] + mat[1][1] * vec[1] + mat[1][2] * vec[2],
                    mat[2][0] * vec[0] + mat[2][1] * vec[1] + mat[2][2] * vec[2]];
                };
                const matrix = getMatrix(Math.PI * dir / 2, width / 2, height / 2);
                let points = [[x, y], [x - t_delta, y + t_delta], [x - t_delta, y - t_delta]];
                points = points.map(p => {
                    let result = applyMatrix(matrix, [...p, 1]);
                    return [result[0], result[1]];
                });
                ctx.beginPath();
                ctx.moveTo(points[0][0], points[0][1]);
                ctx.lineTo(points[1][0], points[1][1]);
                ctx.lineTo(points[2][0], points[2][1]);
                ctx.fill();
            }
            const mouseDelta = {
                x: prevMousePos.current[0] - width / 2,
                y: prevMousePos.current[1] - height / 2
            };
            const theta = Math.atan2(mouseDelta.y, mouseDelta.x);
            let n = getDir(theta);
            for (let i = 0; i < 4; i++) {
                if(i === n) ctx.fillStyle = "rgba(255, 0, 0, 50%)";
                else ctx.fillStyle = "rgba(255, 0, 0, 20%)";
                drawTriangle(2 * width / 5, 0, i);
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
        const rect = e.target.getBoundingClientRect();
        if (targetPattern) {
            setPlacingPattern({
                pos: {
                    x: Math.floor((prevMousePos.current[0] / zoom - offset.x) / cellSize),
                    y: Math.floor((prevMousePos.current[1] / zoom - offset.y) / cellSize)
                },
                pattern: targetPattern
            });
            setTargetPattern(null);
        }
        if(placingPattern){
            const mouseDelta = {
                x: prevMousePos.current[0] - width / 2,
                y: prevMousePos.current[1] - height / 2
            };
            const theta = Math.atan2(mouseDelta.y, mouseDelta.x);
            let dir = [3, 1, 2, 0][getDir(theta)];
            console.log({
                x: placingPattern.pos.x,
                y: placingPattern.pos.y,
                p: placingPattern.pattern,
                s: dir
            });
        }
        prevMousePos.current = [e.clientX - rect.x, e.clientY - rect.y];
    };

    const handleMouseMove = (e) => {
        const rect = e.target.getBoundingClientRect();
        if (mouseDown.current) {
            const dx = e.clientX - rect.x - prevMousePos.current[0];
            const dy = e.clientY - rect.y - prevMousePos.current[1];
            setOffset(prevOffset => ({
                x: prevOffset.x + dx / zoom,
                y: prevOffset.y + dy / zoom
            }));
        }

        prevMousePos.current = [e.clientX - rect.x, e.clientY - rect.y];
        draw();
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

    const handleMouseEnter = (e) => {
        setOnCursor(true);
    }

    const handleMouseLeave = (e) => {
        setOnCursor(false);
    }

    useEffect(() => {
        draw();
    }, [board, zoom, offset, onCursor]);

    useEffect(() => {
        const canvas = canvas_ref.current;
        const scrollBlock = (e) => { e.preventDefault() };
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
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            ></canvas>
        </div>
    );
}
