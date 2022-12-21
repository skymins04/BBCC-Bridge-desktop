"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_window_state_1 = __importDefault(require("electron-window-state"));
const electron_json_storage_1 = __importDefault(require("electron-json-storage"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const title = "BridgeBBCC Desktop";
const version = "v1.0.1";
const BridgeBBCCRootDirPath = path_1.default.resolve(__dirname, "BridgeBBCC");
const BridgeBBCCConfigFilePath = path_1.default.join(BridgeBBCCRootDirPath, "lib", "config.js");
const BridgeBBCCLibDirPath = path_1.default.join(BridgeBBCCRootDirPath, "lib");
const BridgeBBCCThemeDirPath = path_1.default.join(BridgeBBCCRootDirPath, "theme");
const BridgeBBCCClientHTMLPath = path_1.default.join(BridgeBBCCRootDirPath, "client.html");
let window;
let tray;
let mainWindowState;
let interval;
let isIgnoreMouseEvent = false;
const getTitleAndVersion = () => `${title} ${version}`;
const savePosition = () => {
    electron_json_storage_1.default.set("position", { x: mainWindowState.x, y: mainWindowState.y }, process.env.DEBUG
        ? () => {
            console.log("saved pos", {
                x: mainWindowState.x,
                y: mainWindowState.y,
            });
        }
        : () => { });
};
const saveSize = () => {
    const size = window.getSize();
    electron_json_storage_1.default.set("size", { width: size[0], height: size[1] }, process.env.DEBUG
        ? () => {
            console.log("saved size", {
                width: size[0],
                height: size[1],
            });
        }
        : () => { });
};
const changeTheme = (themeName) => {
    const configFile = fs_1.default.readFileSync(BridgeBBCCConfigFilePath).toString();
    fs_1.default.writeFileSync(BridgeBBCCConfigFilePath, configFile.replace(/(?<=theme *\: *\").*(?=\"\,)/gm, themeName));
    window.reload();
};
const checkCurrentTheme = () => {
    const configFile = fs_1.default.readFileSync(BridgeBBCCConfigFilePath).toString();
    const theme = configFile.match(/(?<=theme *\: *\").*(?=\"\,)/gm);
    if (!theme)
        throw Error("Cannot found theme");
    return theme[0];
};
const setTrayContextMenu = () => {
    const currentTheme = checkCurrentTheme();
    const themeList = fs_1.default
        .readdirSync(BridgeBBCCThemeDirPath)
        .filter((x) => x !== "default")
        .map((x) => ({
        label: x,
        type: "radio",
        click: () => changeTheme(x),
        checked: currentTheme === x,
    }));
    const trayMenus = electron_1.Menu.buildFromTemplate([
        { label: getTitleAndVersion(), type: "normal" },
        { type: "separator" },
        {
            label: "마우스 클릭 통과",
            type: "checkbox",
            checked: electron_json_storage_1.default.getSync("ignoreMouseEvent").state ||
                isIgnoreMouseEvent,
            click: (e) => {
                window.setIgnoreMouseEvents(e.checked);
                electron_json_storage_1.default.set("ignoreMouseEvent", { state: e.checked }, () => { });
            },
        },
        {
            label: "테마선택",
            submenu: [
                {
                    label: "기본테마",
                    type: "radio",
                    click: () => changeTheme("default"),
                    checked: currentTheme === "default",
                },
                ...themeList,
            ],
        },
        {
            label: "설정폴더 열기",
            type: "normal",
            click: () => electron_1.shell.openPath(BridgeBBCCLibDirPath),
        },
        {
            label: "테마폴더 열기",
            type: "normal",
            click: () => electron_1.shell.openPath(BridgeBBCCThemeDirPath),
        },
        {
            label: "채팅창 새로고침",
            type: "normal",
            click: () => window.reload(),
        },
        { type: "separator" },
        {
            label: "종료",
            type: "normal",
            click: () => window.close(),
        },
    ]);
    tray.setContextMenu(trayMenus);
};
electron_1.app.on("ready", () => {
    mainWindowState = (0, electron_window_state_1.default)({
        defaultWidth: 500,
        defaultHeight: 800,
    });
    window = new electron_1.BrowserWindow({
        width: electron_json_storage_1.default.getSync("size").width || mainWindowState.width,
        height: electron_json_storage_1.default.getSync("size").height || mainWindowState.height,
        x: electron_json_storage_1.default.getSync("position").x || mainWindowState.x,
        y: electron_json_storage_1.default.getSync("position").y || mainWindowState.y,
        transparent: true,
        frame: false,
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
        },
    });
    window.loadFile(BridgeBBCCClientHTMLPath);
    window.setAlwaysOnTop(true);
    window.setTitle(title);
    window.setIgnoreMouseEvents(electron_json_storage_1.default.getSync("ignoreMouseEvent").state ||
        isIgnoreMouseEvent);
    process.env.DEBUG && window.webContents.openDevTools({ mode: "undocked" });
    interval = setInterval(() => {
        savePosition();
        saveSize();
    }, 500);
    mainWindowState.manage(window);
    const trayIconImage = electron_1.nativeImage.createFromPath(path_1.default.resolve(__dirname, "logo.png"));
    tray = new electron_1.Tray(trayIconImage.resize({ width: 16, height: 16 }));
    tray.setToolTip(getTitleAndVersion());
    setTrayContextMenu();
    fs_1.default.watch(BridgeBBCCThemeDirPath, setTrayContextMenu);
});
electron_1.app.on("will-quit", () => {
    clearInterval(interval);
});
