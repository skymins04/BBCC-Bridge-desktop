"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BridgeBBCCDesktop = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chokidar_1 = __importDefault(require("chokidar"));
const electron_1 = require("electron");
const electron_window_state_1 = __importDefault(require("electron-window-state"));
const functions_1 = require("./functions");
const constants_1 = require("./constants");
class BridgeBBCCDesktop {
    constructor() {
        this.mainWindow = null;
        this.mainWindowState = null;
        this.tray = null;
        this.mainInterval = null;
        this.NOT_CONSTRUCTED_MAIN_WINDOW_ERR = Error("Not construct mainWindow yet.");
        this.NOT_FOUND_THEME = Error("Cannot found theme");
        this.getTitleAndVersion = () => `${constants_1.title} - ${constants_1.version}`;
        electron_1.app.on("ready", () => {
            this.init();
        });
        electron_1.app.on("will-quit", () => {
            this.mainInterval && clearInterval(this.mainInterval);
        });
    }
    init() {
        this.initMainWindow();
        this.initTray();
    }
    initMainWindow() {
        this.mainWindowState = (0, electron_window_state_1.default)({
            defaultWidth: 500,
            defaultHeight: 800,
        });
        this.mainWindow = new electron_1.BrowserWindow({
            width: (0, functions_1.getStorageValue)("size").width || this.mainWindowState.width,
            height: (0, functions_1.getStorageValue)("size").height || this.mainWindowState.height,
            x: (0, functions_1.getStorageValue)("position").x || this.mainWindowState.x,
            y: (0, functions_1.getStorageValue)("position").y || this.mainWindowState.y,
            transparent: true,
            frame: false,
            webPreferences: {
                webSecurity: false,
                nodeIntegration: true,
                contextIsolation: false,
            },
        });
        this.mainWindow.loadFile(constants_1.BridgeBBCCClientHTMLPath);
        this.mainWindow.setAlwaysOnTop(true);
        this.mainWindow.setTitle(constants_1.title);
        this.mainWindow.on("ready-to-show", () => {
            this.setIgnoreWindowMouseEvent((0, functions_1.getStorageValue)("ignoreMouseEvent").state || false);
            this.setShowWindowBorder((0, functions_1.getStorageValue)("showBorder").state || false);
        });
        this.mainInterval = setInterval(() => {
            this.saveWindowPosition();
            this.saveWindowSize();
        }, 500);
        this.mainWindowState.manage(this.mainWindow);
        process.env.DEBUG &&
            this.mainWindow.webContents.openDevTools({ mode: "undocked" });
    }
    initTray() {
        const trayIconImage = electron_1.nativeImage.createFromPath(constants_1.logoImagePath);
        this.tray = new electron_1.Tray(trayIconImage.resize({ width: 16, height: 16 }));
        this.tray.setToolTip(this.getTitleAndVersion());
        this.setTrayContextMenu();
        chokidar_1.default.watch(constants_1.BridgeBBCCThemeDirPath).on("all", () => {
            this.setTrayContextMenu();
        });
    }
    saveWindowPosition() {
        if (this.mainWindowState) {
            (0, functions_1.setStorageValue)("position", {
                x: this.mainWindowState.x,
                y: this.mainWindowState.y,
            });
        }
        else
            throw this.NOT_CONSTRUCTED_MAIN_WINDOW_ERR;
    }
    saveWindowSize() {
        if (this.mainWindow) {
            const size = this.mainWindow.getSize();
            (0, functions_1.setStorageValue)("size", { width: size[0], height: size[1] });
        }
        else
            throw this.NOT_CONSTRUCTED_MAIN_WINDOW_ERR;
    }
    setIgnoreWindowMouseEvent(state) {
        if (this.mainWindow) {
            this.mainWindow.setIgnoreMouseEvents(state);
            (0, functions_1.setStorageValue)("ignoreMouseEvent", { state });
        }
        else
            throw this.NOT_CONSTRUCTED_MAIN_WINDOW_ERR;
    }
    setShowWindowBorder(state) {
        if (this.mainWindow) {
            this.mainWindow.webContents.send("show-border", state);
            (0, functions_1.setStorageValue)("showBorder", { state });
        }
        else
            throw this.NOT_CONSTRUCTED_MAIN_WINDOW_ERR;
    }
    setTrayContextMenu() {
        var _a;
        if (this.mainWindow) {
            const currentTheme = this.checkCurrentBridgeBBCCTheme();
            const themeMenus = fs_1.default
                .readdirSync(constants_1.BridgeBBCCThemeDirPath, { withFileTypes: true })
                .filter((x) => x.isDirectory() &&
                fs_1.default.existsSync(path_1.default.join(constants_1.BridgeBBCCThemeDirPath, x.name, "theme.css")) &&
                x.name !== "default")
                .map((x) => ({
                label: x.name,
                type: "radio",
                click: () => this.changeBridgeBBCCTheme(x.name),
                checked: currentTheme === x.name,
            }));
            const trayMenus = electron_1.Menu.buildFromTemplate([
                { label: this.getTitleAndVersion(), type: "normal" },
                { type: "separator" },
                {
                    label: "마우스 클릭 통과",
                    type: "checkbox",
                    checked: (0, functions_1.getStorageValue)("ignoreMouseEvent").state || false,
                    click: (e) => this.setIgnoreWindowMouseEvent(e.checked),
                },
                {
                    label: "채팅창 외곽선 보기",
                    type: "checkbox",
                    checked: (0, functions_1.getStorageValue)("showBorder").state || false,
                    click: (e) => this.setShowWindowBorder(e.checked),
                },
                { type: "separator" },
                {
                    label: "테마선택",
                    submenu: [
                        {
                            label: "기본테마",
                            type: "radio",
                            click: () => this.changeBridgeBBCCTheme("default"),
                            checked: currentTheme === "default",
                        },
                        ...themeMenus,
                    ],
                },
                {
                    label: "설정폴더 열기",
                    type: "normal",
                    click: () => electron_1.shell.openPath(constants_1.BridgeBBCCLibDirPath),
                },
                {
                    label: "테마폴더 열기",
                    type: "normal",
                    click: () => electron_1.shell.openPath(constants_1.BridgeBBCCThemeDirPath),
                },
                {
                    label: "채팅창 새로고침",
                    type: "normal",
                    click: () => { var _a; return (_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.reload(); },
                },
                {
                    label: "개발자도구 열기",
                    type: "normal",
                    click: () => { var _a; return (_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.webContents.openDevTools(); },
                },
                { type: "separator" },
                {
                    label: "종료",
                    type: "normal",
                    click: () => { var _a; return (_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.close(); },
                },
            ]);
            (_a = this.tray) === null || _a === void 0 ? void 0 : _a.setContextMenu(trayMenus);
        }
        else
            throw this.NOT_CONSTRUCTED_MAIN_WINDOW_ERR;
    }
    checkCurrentBridgeBBCCTheme() {
        const configFile = fs_1.default.readFileSync(constants_1.BridgeBBCCConfigFilePath).toString();
        const theme = configFile.match(/(?<=theme *\: *\").*(?=\"\,)/gm);
        if (!theme)
            throw this.NOT_FOUND_THEME;
        return theme[0];
    }
    changeBridgeBBCCTheme(themeName) {
        if (this.mainWindow) {
            const configFile = fs_1.default.readFileSync(constants_1.BridgeBBCCConfigFilePath).toString();
            fs_1.default.writeFileSync(constants_1.BridgeBBCCConfigFilePath, configFile.replace(/(?<=theme *\: *\").*(?=\"\,)/gm, themeName));
            this.mainWindow.reload();
        }
        else
            throw this.NOT_CONSTRUCTED_MAIN_WINDOW_ERR;
    }
}
exports.BridgeBBCCDesktop = BridgeBBCCDesktop;
