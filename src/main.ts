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

// Data structure to store drawing lines and points
const lines: Array<Array<{ x: number; y: number }>> = [];
const redoStack: Array<Array<{ x: number; y: number }>> = [];
let currentLine: Array<{ x: number; y: number }> = [];
let isDrawing = false; // Tracks if user is actively drawing

// Start Drawing: initialize a new line and add the first point
canvas.addEventListener("mousedown", (event) => {
    isDrawing = true; 
    currentLine = [];
    lines.push(currentLine);
    redoStack.length = 0; // Clear the redo stack when starting a new drawing
    canvas.dispatchEvent(new Event("drawing-changed"));
});

// Continue Drawing: add points as mouse moves
canvas.addEventListener('mousemove', (event) => {
    if (!isDrawing) return;
    currentLine.push({ x: event.offsetX, y: event.offsetY});
    canvas.dispatchEvent(new Event("drawing-changed"));
});

// Stop Drawing: finalize the current line
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

// Redraw the canvas: clear and redraw all lines
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach((line) => {
        if (line.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);
        line.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.stroke();
        ctx.closePath();
    });
}

// Observer for the "drawing-changed" event
canvas.addEventListener("drawing-changed", redrawCanvas);

// Create "Clear" button
const clearButton = document.createElement('button');
clearButton.textContent = "Clear";
app.append(clearButton);

// Clear button event handler
clearButton.addEventListener("click", () => {
    lines.length = 0; // Clear the data structure
    redrawCanvas();          // Clear the canvas
    canvas.dispatchEvent(new Event("drawing-changed"));
});

// Create "Undo" button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
app.append(undoButton);

// Undo button event handler
undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        const lastLine = lines.pop()!;
        redoStack.push(lastLine); // Move the last line to the redo stack
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

// Create "Redo" button
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
app.append(redoButton);

// Redo button event handler
redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const lastRedoLine = redoStack.pop()!;
        lines.push(lastRedoLine); // Move the last redo line back to lines
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});