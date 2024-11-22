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

interface Line {
    points: { x: number; y: number }[];
    thickness: number;
    drag(x: number, y: number): void;
    display(ctx: CanvasRenderingContext2D): void;
};

// Function to create a new line
function createLine(initialX: number, initialY: number, thickness: number): Line {
    return {
        points: [{ x: initialX, y: initialY }],
        thickness,
        drag(x: number, y: number) {
            this.points.push({ x, y });
        },
        display(ctx: CanvasRenderingContext2D) {
            if (this.points.length < 2) return;
            ctx.lineWidth = this.thickness;
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            this.points.forEach((point) => ctx.lineTo(point.x, point.y));
            ctx.stroke();
            ctx.closePath();
        },
    };
};

// Data structure to store drawing lines and points
const drawingLines: Line[] = [];
const redoStack: Line[] = [];
let currentLine: Line | null = null;
let isDrawing = false; 
let currentThickness= 2;

// Start Drawing: initialize a new line and add the first point
canvas.addEventListener("mousedown", (event) => {
    isDrawing = true; 
    currentLine = createLine(event.offsetX, event.offsetY, currentThickness);
    drawingLines.push(currentLine);
    redoStack.length = 0; // Clear the redo stack when starting a new drawing
    canvas.dispatchEvent(new Event("drawing-changed"));
});

// Continue Drawing: add points as mouse moves
canvas.addEventListener('mousemove', (event) => {
    if (!isDrawing || !currentLine) return;
    currentLine.drag(event.offsetX, event.offsetY);
    canvas.dispatchEvent(new Event("drawing-changed"));
});

// Stop Drawing: finalize the current line
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    currentLine = null;
});

// Redraw the canvas: clear and redraw all lines
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingLines.forEach((line) => line.display(ctx)); // Call display method for each line
}

// Observer for the "drawing-changed" event
canvas.addEventListener("drawing-changed", redrawCanvas);

// Create "Clear" button
const clearButton = document.createElement('button');
clearButton.textContent = "Clear";
app.append(clearButton);

// Clear button event handler
clearButton.addEventListener("click", () => {
    drawingLines.length = 0; // Clear the data structure
    redrawCanvas();          // Clear the canvas
    canvas.dispatchEvent(new Event("drawing-changed"));
});

// Create "Undo" button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
app.append(undoButton);

// Undo button event handler
undoButton.addEventListener("click", () => {
    if (drawingLines.length > 0) {
        const lastLine = drawingLines.pop()!;
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
        drawingLines.push(lastRedoLine); // Move the last redo line back to lines
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

// Create "Thin" and "Thick" marker buttons
const thinButton = document.createElement('button');
thinButton.textContent = "Thin";
app.append(thinButton);

const thickButton = document.createElement('button');
thickButton.textContent = "Thick";
app.append(thickButton);

// Handle "Thin" button click: set the thickness to 2
thinButton.addEventListener("click", () => {
    currentThickness = 2;
    thinButton.classList.add('selectedTool');
    thickButton.classList.remove('selectedTool');
});

// Handle "Thick" button click: set the thickness to 5
thickButton.addEventListener("click", () => {
    currentThickness = 5;
    thickButton.classList.add('selectedTool');
    thinButton.classList.remove('selectedTool');
});