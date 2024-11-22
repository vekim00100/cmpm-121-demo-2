import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const APP_NAME = "Sticker Sketchpad";
document.title = APP_NAME;

const header = document.createElement("h1");
header.innerHTML = APP_NAME;
app.append(header);

// Creating canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.append(canvas);

// Get drawing context for canvas
const ctx = canvas.getContext("2d")!;
ctx.strokeStyle = "#000000";
ctx.lineWidth = 2;

// State variable to track if user is currently drawing
let isDrawing = false;

// Start Drawing
canvas.addEventListener("mousedown", (event) => {
    isDrawing = true; 
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
});

// Drawing 
canvas.addEventListener('mousemove', (event) => {
    if (!isDrawing) return;
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
});

// Stop Drawing
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    ctx.closePath();
});

// Create "Clear" button
const clearButton = document.createElement('button');
clearButton.textContent = "Clear";
app.append(clearButton);

// Create clear function
clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
