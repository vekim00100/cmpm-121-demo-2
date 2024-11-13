import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const APP_NAME = "Small Change";
document.title = APP_NAME;

const header = document.createElement("h1");
header.innerHTML = APP_NAME;
app.append(header);

// Creating canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.append(canvas);
