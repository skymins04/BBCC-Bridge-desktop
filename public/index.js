"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_window_state_1 = __importDefault(require("electron-window-state"));
const electron_json_storage_1 = __importDefault(require("electron-json-storage"));
let window;
electron_1.app.on("ready", () => {
    const mainWindowState = (0, electron_window_state_1.default)({
        defaultWidth: 500,
        defaultHeight: 800,
    });
    window = new electron_1.BrowserWindow({
        width: mainWindowState.width,
        height: mainWindowState.height,
        x: electron_json_storage_1.default.getSync("position").x || mainWindowState.x,
        y: electron_json_storage_1.default.getSync("position").y || mainWindowState.y,
        transparent: true,
        frame: false,
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
        },
    });
    window.loadFile(`./public/BridgeBBCC/client.html`);
    window.setAlwaysOnTop(true);
    window.setTitle("BridgeBBCC Desktop");
    process.env.DEBUG && window.webContents.openDevTools({ mode: "undocked" });
    window.on("move", () => {
        electron_json_storage_1.default.set("position", { x: mainWindowState.x, y: mainWindowState.y }, () => {
            console.log("saved", { x: mainWindowState.x, y: mainWindowState.y });
        });
    });
    mainWindowState.manage(window);
});
