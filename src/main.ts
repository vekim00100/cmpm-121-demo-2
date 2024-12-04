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

// Data structure to store drawing lines, stickers, and points
const drawingLines: (Line | Sticker)[] = [];
const redoStack: (Line | Sticker)[] = [];
let currentLine: Line | null = null;
let isDrawing = false;
let currentThickness = 2;
let toolPreview: ToolPreview | null = null;
let stickerPreview: StickerPreview | null = null;
let activeSticker: Sticker | null = null;

// Data-driven sticker set
const initialStickers: Sticker[] = [
    { emoji: "🐱" },
    { emoji: "🍎" },
    { emoji: "🎉" },
];

// Interface definitions
interface ToolPreview {
    draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
}

interface Line {
    points: { x: number; y: number }[];
    thickness: number;
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
}

// Function to create a sticker
function createSticker(x: number, y: number, emoji: string): Sticker {
    return {
        x,
        y,
        emoji,
        display(ctx: CanvasRenderingContext2D) {
            ctx.font = "30px Arial";
            ctx.fillText(this.emoji, this.x - 15, this.y + 10);
        }
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
});

// Continue Drawing: add points as mouse moves
canvas.addEventListener('mousemove', (event) => {
    if (isDrawing && currentLine) {
        currentLine.drag(event.offsetX, event.offsetY);
        canvas.dispatchEvent(new Event("drawing-changed"));
    } else if (!isDrawing && toolPreview) {
        // Draw the tool preview if mouse is not down
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing preview
        redrawCanvas();
        toolPreview.draw(ctx, event.offsetX, event.offsetY); // Draw the preview
        canvas.dispatchEvent(new Event("tool-moved"));
    } else if (!isDrawing && stickerPreview) {
        // Show the sticker preview as the cursor moves
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing preview
        redrawCanvas();
        stickerPreview.draw(ctx, event.offsetX, event.offsetY); // Draw the sticker preview
        stickerPreview.x = event.offsetX;
        stickerPreview.y = event.offsetY;
        canvas.dispatchEvent(new Event("tool-moved"));
    }
});

// Stop Drawing: finalize the current line
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    currentLine = null;
});

// Redraw the canvas: clear and redraw all lines and stickers
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingLines.forEach((item) => {
        if ('emoji' in item) {
            item.display(ctx); // For stickers
        } else {
            item.display(ctx); // For lines
        }
    });
}

// Observer for the "drawing-changed" event
canvas.addEventListener("drawing-changed", redrawCanvas);

// Undo and Redo functionality
canvas.addEventListener("tool-moved", () => {
    console.log("Tool moved to:");
});

// Create buttons dynamically based on initial stickers and options
const buttonsConfig = [
    { text: "Clear Canvas", id: "clear-button" },
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
    currentThickness = 5;
    toolPreview = createCirclePreview(currentThickness); // This is for drawing tool
    canvas.dispatchEvent(new Event("tool-moved")); // Trigger tool-moved immediately
});

// Function to handle custom sticker creation
createStickerButton.addEventListener("click", () => {
    const customEmoji = prompt("Enter custom emoji for sticker:", "");
    if (customEmoji) {
        initialStickers.push({ emoji: customEmoji }); // Add the custom sticker to the list
        const customStickerButton = document.createElement("button");
        customStickerButton.textContent = customEmoji;
        customStickerButton.id = `${customEmoji}-sticker`;
        customStickerButton.style.margin = "10px 5px";
        app.appendChild(customStickerButton);

        customStickerButton.addEventListener("click", () => {
            stickerPreview = new StickerPreview(customEmoji);
            toolPreview = stickerPreview; // Set toolPreview to be the sticker preview
            canvas.dispatchEvent(new Event("tool-moved"));
        });
    }
});

// Sticker Buttons (Change these to create the sticker preview dynamically)
initialStickers.forEach((sticker) => {
    const stickerButton = document.getElementById(`${sticker.emoji}-sticker`)!;
    stickerButton.addEventListener("click", () => {
        stickerPreview = new StickerPreview(sticker.emoji);
        toolPreview = stickerPreview; // Set toolPreview to be the sticker preview
        canvas.dispatchEvent(new Event("tool-moved"));
    });
});

// Function to create a circle preview tool
function createCirclePreview(thickness: number): ToolPreview {
    return {
        draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
            ctx.beginPath();
            ctx.arc(x, y, thickness / 2, 0, Math.PI * 2); // Draw circle with radius based on thickness
            ctx.stroke();
        }
    };
}

// Sticker preview class to display emoji
class StickerPreview implements ToolPreview {
    emoji: string;
    x: number = 0;
    y: number = 0;

    constructor(emoji: string) {
        this.emoji = emoji;
    }

    draw(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        this.x = x;
        this.y = y;
        ctx.font = "30px Arial";
        ctx.fillText(this.emoji, x - 15, y + 10);
    }
}

// Trigger initial tool preview
toolPreview = createCirclePreview(currentThickness);
canvas.dispatchEvent(new Event("tool-moved"));
