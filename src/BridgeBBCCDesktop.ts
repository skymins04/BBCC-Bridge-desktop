import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import {
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  Tray,
  app,
  nativeImage,
  shell,
} from "electron";
import electronWindowState, { State } from "electron-window-state";
import { getStorageValue, setStorageValue } from "./functions";
import {
  BridgeBBCCClientHTMLPath,
  BridgeBBCCConfigFilePath,
  BridgeBBCCLibDirPath,
  BridgeBBCCThemeDirPath,
  logoImagePath,
  title,
  version,
} from "./constants";

export class BridgeBBCCDesktop {
  constructor() {
    app.on("ready", () => {
      this.init();
    });
    app.on("will-quit", () => {
      this.mainInterval && clearInterval(this.mainInterval);
    });
  }

  private mainWindow: BrowserWindow | null = null;
  private mainWindowState: State | null = null;
  private tray: Tray | null = null;
  private mainInterval: NodeJS.Timer | null = null;

  private NOT_CONSTRUCTED_MAIN_WINDOW_ERR = Error(
    "Not construct mainWindow yet."
  );
  private NOT_FOUND_THEME = Error("Cannot found theme");

  private init() {
    this.initMainWindow();
    this.initTray();
  }

  private initMainWindow() {
    this.mainWindowState = electronWindowState({
      defaultWidth: 500,
      defaultHeight: 800,
    });
    this.mainWindow = new BrowserWindow({
      width: getStorageValue("size").width || this.mainWindowState.width,
      height: getStorageValue("size").height || this.mainWindowState.height,
      x: getStorageValue("position").x || this.mainWindowState.x,
      y: getStorageValue("position").y || this.mainWindowState.y,
      transparent: true,
      frame: false,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        contextIsolation: false,
      },
    });
    this.mainWindow.loadFile(BridgeBBCCClientHTMLPath);
    this.mainWindow.setAlwaysOnTop(true);
    this.mainWindow.setTitle(title);
    this.mainWindow.on("ready-to-show", () => {
      this.setIgnoreWindowMouseEvent(
        getStorageValue("ignoreMouseEvent").state || false
      );
      this.setShowWindowBorder(getStorageValue("showBorder").state || false);
    });
    this.mainInterval = setInterval(() => {
      this.saveWindowPosition();
      this.saveWindowSize();
    }, 500);
    this.mainWindowState.manage(this.mainWindow);
    process.env.DEBUG &&
      this.mainWindow.webContents.openDevTools({ mode: "undocked" });
  }

  private initTray() {
    const trayIconImage = nativeImage.createFromPath(logoImagePath);
    this.tray = new Tray(trayIconImage.resize({ width: 16, height: 16 }));
    this.tray.setToolTip(this.getTitleAndVersion());
    this.setTrayContextMenu();
    chokidar.watch(BridgeBBCCThemeDirPath).on("all", () => {
      this.setTrayContextMenu();
    });
  }

  private getTitleAndVersion = () => `${title} - ${version}`;

  private saveWindowPosition() {
    if (this.mainWindowState) {
      setStorageValue("position", {
        x: this.mainWindowState.x,
        y: this.mainWindowState.y,
      });
    } else throw this.NOT_CONSTRUCTED_MAIN_WINDOW_ERR;
  }

  private saveWindowSize() {
    if (this.mainWindow) {
      const size = this.mainWindow.getSize();
      setStorageValue("size", { width: size[0], height: size[1] });
    } else throw this.NOT_CONSTRUCTED_MAIN_WINDOW_ERR;
  }

  private setIgnoreWindowMouseEvent(state: boolean) {
    if (this.mainWindow) {
      this.mainWindow.setIgnoreMouseEvents(state);
      setStorageValue("ignoreMouseEvent", { state });
    } else throw this.NOT_CONSTRUCTED_MAIN_WINDOW_ERR;
  }

  private setShowWindowBorder(state: boolean) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send("show-border", state);
      setStorageValue("showBorder", { state });
    } else throw this.NOT_CONSTRUCTED_MAIN_WINDOW_ERR;
  }

  private setTrayContextMenu() {
    if (this.mainWindow) {
      const currentTheme = this.checkCurrentBridgeBBCCTheme();
      const themeMenus: MenuItemConstructorOptions[] = fs
        .readdirSync(BridgeBBCCThemeDirPath, { withFileTypes: true })
        .filter(
          (x) =>
            x.isDirectory() &&
            fs.existsSync(
              path.join(BridgeBBCCThemeDirPath, x.name, "theme.css")
            ) &&
            x.name !== "default"
        )
        .map((x) => ({
          label: x.name,
          type: "radio",
          click: () => this.changeBridgeBBCCTheme(x.name),
          checked: currentTheme === x.name,
        }));
      const trayMenus = Menu.buildFromTemplate([
        { label: this.getTitleAndVersion(), type: "normal" },
        { type: "separator" },
        {
          label: "마우스 클릭 통과",
          type: "checkbox",
          checked: getStorageValue("ignoreMouseEvent").state || false,
          click: (e) => this.setIgnoreWindowMouseEvent(e.checked),
        },
        {
          label: "채팅창 외곽선 보기",
          type: "checkbox",
          checked: getStorageValue("showBorder").state || false,
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
          click: () => shell.openPath(BridgeBBCCLibDirPath),
        },
        {
          label: "테마폴더 열기",
          type: "normal",
          click: () => shell.openPath(BridgeBBCCThemeDirPath),
        },
        {
          label: "채팅창 새로고침",
          type: "normal",
          click: () => this.mainWindow?.reload(),
        },
        {
          label: "개발자도구 열기",
          type: "normal",
          click: () => this.mainWindow?.webContents.openDevTools(),
        },
        { type: "separator" },
        {
          label: "종료",
          type: "normal",
          click: () => this.mainWindow?.close(),
        },
      ]);
      this.tray?.setContextMenu(trayMenus);
    } else throw this.NOT_CONSTRUCTED_MAIN_WINDOW_ERR;
  }

  private checkCurrentBridgeBBCCTheme() {
    const configFile = fs.readFileSync(BridgeBBCCConfigFilePath).toString();
    const theme = configFile.match(/(?<=theme *\: *\").*(?=\"\,)/gm);
    if (!theme) throw this.NOT_FOUND_THEME;
    return theme[0];
  }

  private changeBridgeBBCCTheme(themeName: string) {
    if (this.mainWindow) {
      const configFile = fs.readFileSync(BridgeBBCCConfigFilePath).toString();
      fs.writeFileSync(
        BridgeBBCCConfigFilePath,
        configFile.replace(/(?<=theme *\: *\").*(?=\"\,)/gm, themeName)
      );
      this.mainWindow.reload();
    } else throw this.NOT_CONSTRUCTED_MAIN_WINDOW_ERR;
  }
}
