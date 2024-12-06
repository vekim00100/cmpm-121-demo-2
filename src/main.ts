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

// Create button container
const buttonContainer = document.createElement("div");
buttonContainer.id = "button-container";
app.appendChild(buttonContainer);

// Canvas drawing context
const ctx = canvas.getContext("2d")!;
ctx.strokeStyle = "#000000";

// Data structure to store drawing lines, stickers, and points
const drawingLines: (Line | Sticker)[] = [];
const redoStack: (Line | Sticker)[] = [];
let currentLine: Line | null = null;
let isDrawing = false;
let currentThickness = 2;
let toolPreview: ToolPreview | null = null;
let stickerPreview: StickerPreview | null = null;


function drawDefaultContent() {
    const message = "Welcome to Sticker Sketchpad!";
    ctx.font = "15px Arial";
    ctx.fillStyle = "#888888"; // Light gray text

    // Calculate the width of the text to center it
    const textWidth = ctx.measureText(message).width;  
    const x = (canvas.width - textWidth) / 2;  
    const y = canvas.height / 2;  

    // Draw the text using the calculated position
    ctx.fillText(message, x, y);
}

// Call this function on initial load to show the message
drawDefaultContent();

// Function to display a sticker on the canvas
function displaySticker(ctx: CanvasRenderingContext2D, emoji: string, x: number, y: number) {
    ctx.font = "30px Arial";
    ctx.fillText(emoji, x - 15, y + 10);
}

// Data-driven sticker set
const initialStickers: Sticker[] = [
    { x: 0, y: 0, emoji: "🐱", display(ctx) { displaySticker(ctx, this.emoji, this.x, this.y); } },
    { x: 0, y: 0, emoji: "🍎", display(ctx) { displaySticker(ctx, this.emoji, this.x, this.y); } },
    { x: 0, y: 0, emoji: "🎉", display(ctx) { displaySticker(ctx, this.emoji, this.x, this.y); } },
];

// Interface definitions
interface ToolPreview {
    draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
}

interface Line {
    points: { x: number; y: number }[];
    thickness: number;
    color: string; // Store color for each line
    drag(x: number, y: number): void;
    display(ctx: CanvasRenderingContext2D): void;
}

interface Sticker {
    x: number;
    y: number;
    emoji: string;
    display(ctx: CanvasRenderingContext2D): void;
}

// Function to create a new line
function createLine(initialX: number, initialY: number, thickness: number): Line {
    const color = getRandomColor(); // Set color when the line is created
    return {
        points: [{ x: initialX, y: initialY }],
        thickness,
        color, // Store color for the line
        drag(x, y) { this.points.push({ x, y }); },
        display(ctx) {
            if (this.points.length < 2) return;
            ctx.lineWidth = this.thickness;
            ctx.strokeStyle = this.color; // Apply color here when drawing the line
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            this.points.forEach((point) => ctx.lineTo(point.x, point.y));
            ctx.stroke();
            ctx.closePath();
        },
    };
}

// Function to create a sticker
function createSticker(x: number, y: number, emoji: string): Sticker {
    return {
        x,
        y,
        emoji,
        display(ctx) { displaySticker(ctx, this.emoji, this.x, this.y); },
    };
}

// Start Drawing: initialize a new line and add the first point
canvas.addEventListener("mousedown", (event) => {
    if (stickerPreview) {
        // Place the sticker when clicked
        const sticker = createSticker(event.offsetX, event.offsetY, stickerPreview.emoji);
        drawingLines.push(sticker);
        stickerPreview = null; // Clear the preview after placing the sticker
        toolPreview = createCirclePreview(currentThickness); // Reset the preview to the default tool
        canvas.dispatchEvent(new Event("drawing-changed"));
    } else {
        isDrawing = true;
        currentLine = createLine(event.offsetX, event.offsetY, currentThickness);
        drawingLines.push(currentLine);
        redoStack.length = 0; // Clear the redo stack when starting a new drawing
        canvas.dispatchEvent(new Event("drawing-changed"));
    }

    // Clear default content when user starts drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
});

// Continue Drawing: add points as mouse moves
canvas.addEventListener('mousemove', (event) => {
    if (isDrawing && currentLine) {
        currentLine.drag(event.offsetX, event.offsetY);
        canvas.dispatchEvent(new Event("drawing-changed"));
    } else if (toolPreview || stickerPreview) {
        // Show the preview
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        redrawCanvas();
        (toolPreview || stickerPreview)?.draw(ctx, event.offsetX, event.offsetY);
    }
});

// Stop Drawing: finalize the current line
canvas.addEventListener('mouseup', () => { isDrawing = false; currentLine = null; });


// Redraw the canvas: clear and redraw all lines and stickers
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingLines.forEach((item) => item.display(ctx));
}

// Observer for the "drawing-changed" event
canvas.addEventListener("drawing-changed", redrawCanvas);

// Undo and Redo functionality
canvas.addEventListener("tool-moved", () => {
    console.log("Tool moved to:");
});

// Create buttons dynamically based on initial stickers and options
const buttonsConfig = [
    { text: "Clear", id: "clear-button" },
    { text: "Undo", id: "undo-button" },
    { text: "Redo", id: "redo-button" },
    { text: "Thin", id: "thin-button" },
    { text: "Thick", id: "thick-button" },
    ...initialStickers.map(sticker => ({ text: sticker.emoji, id: `${sticker.emoji}-sticker` })),
    { text: "Create Custom Sticker", id: "create-sticker-button" },
];

buttonsConfig.forEach(({ text, id }) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.id = id;
    button.style.margin = "10px 5px";
    app.appendChild(button);
});

const clearButton = document.getElementById("clear-button")!;
const undoButton = document.getElementById("undo-button")!;
const redoButton = document.getElementById("redo-button")!;
const thinButton = document.getElementById("thin-button")!;
const thickButton = document.getElementById("thick-button")!;
const createStickerButton = document.getElementById("create-sticker-button")!;

// Clear button event handler
clearButton.addEventListener("click", () => {
    drawingLines.length = 0; // Clear the data structure
    redrawCanvas();          // Clear the canvas
    drawDefaultContent();    // Show the default content again
    canvas.dispatchEvent(new Event("drawing-changed"));
});

// Undo button event handler
undoButton.addEventListener("click", () => {
    if (drawingLines.length > 0) {
        const lastItem = drawingLines.pop()!;
        redoStack.push(lastItem); // Move the last item to the redo stack
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

// Redo button event handler
redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const lastRedoItem = redoStack.pop()!;
        drawingLines.push(lastRedoItem); // Move the last redo item back to drawing lines
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

// Handle "Thin" button click: set the thickness to 2
thinButton.addEventListener("click", () => {
    currentThickness = 2;
    toolPreview = createCirclePreview(currentThickness); // This is for drawing tool
    canvas.dispatchEvent(new Event("tool-moved")); // Trigger tool-moved immediately
});

// Handle "Thick" button click: set the thickness to 5
thickButton.addEventListener("click", () => {
    currentThickness = 4;
    toolPreview = createCirclePreview(currentThickness); // This is for drawing tool
    canvas.dispatchEvent(new Event("tool-moved")); // Trigger tool-moved immediately
});

// Function to handle custom sticker creation
createStickerButton.addEventListener("click", () => {
    const customEmoji = prompt("Enter custom emoji for sticker:", "");
    if (customEmoji) {
        // Create a complete Sticker object
        const customSticker = {
            x: 0,
            y: 0,
            emoji: customEmoji,
            display(ctx: CanvasRenderingContext2D) {
                ctx.font = "30px Arial";
                ctx.fillText(this.emoji, this.x - 15, this.y + 10);
            }
        };

        // Add the custom sticker to the list
        initialStickers.push(customSticker);

        // Create a button for the custom sticker
        const customStickerButton = document.createElement("button");
        customStickerButton.textContent = customEmoji;
        customStickerButton.id = `${customEmoji}-sticker`;
        customStickerButton.style.margin = "10px 5px";
        app.appendChild(customStickerButton);

        // Add an event listener for the new sticker button
        customStickerButton.addEventListener("click", () => {
            stickerPreview = new StickerPreview(customEmoji);
            toolPreview = stickerPreview; // Set toolPreview to be the sticker preview
            canvas.dispatchEvent(new Event("tool-moved"));
        });
    }
});

// Initial sticker buttons
initialStickers.forEach((sticker) => {
    const stickerButton = document.getElementById(`${sticker.emoji}-sticker`)!;
    stickerButton.addEventListener("click", () => {
        stickerPreview = new StickerPreview(sticker.emoji);
        toolPreview = stickerPreview; // Set toolPreview to be the sticker preview
        canvas.dispatchEvent(new Event("tool-moved"));
    });
});

// Tool preview for stickers
class StickerPreview implements ToolPreview {
    emoji: string;
    constructor(emoji: string) { this.emoji = emoji; }
    draw(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        displaySticker(ctx, this.emoji, x, y);
    }
}

// Tool preview for drawing (a circle preview)
function createCirclePreview(thickness: number): ToolPreview {
    return {
        draw(ctx, x, y) {
            ctx.beginPath();
            ctx.arc(x, y, thickness, 0, 2 * Math.PI);
            ctx.stroke();
        }
    };
}

// Random color generator
function getRandomColor(): string {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
