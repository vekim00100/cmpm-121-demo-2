import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const APP_NAME = "Sticker Sketchpad";
document.title = APP_NAME;

// Add app title header
const header = document.createElement("h1");
header.innerHTML = APP_NAME;
app.append(header);

// Create and configure canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.append(canvas);

// Canvas drawing context
const ctx = canvas.getContext("2d")!;
ctx.strokeStyle = "#000000";
ctx.lineWidth = 2;

// Data strucutre to store drawing points
// Each arrray represents a line, and each contain points [x, y]
const drawingLines: Array<Array<{ x: number; y: number }>> = [];

// Current line being drawn
let currentLine: Array<{ x: number; y: number }> = [];

// State variable to track drawing
let isDrawing = false;

// Start Drawing
canvas.addEventListener("mousedown", (event) => {
    isDrawing = true; 

    currentLine = [];
    drawingLines.push(currentLine);
    // Add first point to the current line
    currentLine.push({ x: event.offsetX, y: event.offsetY });
    // Dispatch the "drawing-changed" event
    canvas.dispatchEvent(new Event("drawing-changed"));

    // ctx.beginPath();
    // ctx.moveTo(event.offsetX, event.offsetY);
});

// Drawing 
canvas.addEventListener('mousemove', (event) => {
    if (!isDrawing) return;

    // Add the current point to the line
    currentLine.push({ x: event.offsetX, y: event.offsetY});
    // Dispatch the "drawing-changed" event
    canvas.dispatchEvent(new Event("drawing-changed"));

    // ctx.lineTo(event.offsetX, event.offsetY);
    // ctx.stroke();
});

// Stop Drawing
canvas.addEventListener('mouseup', () => {
    isDrawing = false;

    // Dispatch the "drawing-changed" event
    canvas.dispatchEvent(new Event("drawing-changed"));
});

// Observer for the "drawing-changed" event
canvas.addEventListener("drawing-changed", () => {
    redrawCanvas();
});

// Redraw the canvas: clear and redraw all lines
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    for (const line of drawingLines) {
        if (line.length < 2) continue; // Skip if there's nothing to draw
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);
        for (const point of line) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
        ctx.closePath();
    }
};

// Create "Clear" button
const clearButton = document.createElement('button');
clearButton.textContent = "Clear";
app.append(clearButton);

// Clear button event handler
clearButton.addEventListener("click", () => {
    drawingLines.length = 0; // Clear the data structure
    redrawCanvas();          // Clear the canvas
});