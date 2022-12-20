import { app, BrowserWindow, Menu, nativeImage, shell, Tray } from "electron";
import electronWindowState from "electron-window-state";
import electronStorage from "electron-json-storage";
import fs from "fs";
import path from "path";

const title = "BridgeBBCC Desktop";
const version = "v1.0.0";

const BridgeBBCCRootDirPath = path.resolve(__dirname, "BridgeBBCC");
const BridgeBBCCConfigFilePath = path.join(
  BridgeBBCCRootDirPath,
  "lib",
  "config.js"
);
const BridgeBBCCLibDirPath = path.join(BridgeBBCCRootDirPath, "lib");
const BridgeBBCCThemeDirPath = path.join(BridgeBBCCRootDirPath, "theme");
const BridgeBBCCClientHTMLPath = path.join(
  BridgeBBCCRootDirPath,
  "client.html"
);

let window: BrowserWindow;
let tray: Tray;
let mainWindowState: electronWindowState.State;
let interval: NodeJS.Timer;

const getTitleAndVersion = () => `${title} ${version}`;

const savePosition = () => {
  electronStorage.set(
    "position",
    { x: mainWindowState.x, y: mainWindowState.y },
    process.env.DEBUG
      ? () => {
          console.log("saved pos", {
            x: mainWindowState.x,
            y: mainWindowState.y,
          });
        }
      : () => {}
  );
};
const saveSize = () => {
  const size = window.getSize();
  electronStorage.set(
    "size",
    { width: size[0], height: size[1] },
    process.env.DEBUG
      ? () => {
          console.log("saved size", {
            width: size[0],
            height: size[1],
          });
        }
      : () => {}
  );
};

const changeTheme = (themeName: string) => {
  const configFile = fs.readFileSync(BridgeBBCCConfigFilePath).toString();
  fs.writeFileSync(
    BridgeBBCCConfigFilePath,
    configFile.replace(/(?<=theme *\: *\").*(?=\"\,)/gm, themeName)
  );
  window.reload();
};

const checkCurrentTheme = () => {
  const configFile = fs.readFileSync(BridgeBBCCConfigFilePath).toString();
  const theme = configFile.match(/(?<=theme *\: *\").*(?=\"\,)/gm);
  if (!theme) throw Error("Cannot found theme");
  return theme[0];
};

const setTrayContextMenu = () => {
  const currentTheme = checkCurrentTheme();
  const themeList: {
    label: string;
    type: "radio";
    click: () => void;
    checked: boolean;
  }[] = fs
    .readdirSync(BridgeBBCCThemeDirPath)
    .filter((x) => x !== "default")
    .map((x) => ({
      label: x,
      type: "radio",
      click: () => changeTheme(x),
      checked: currentTheme === x,
    }));
  const trayMenus = Menu.buildFromTemplate([
    { label: getTitleAndVersion(), type: "normal" },
    { type: "separator" },
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
      click: () => window.reload(),
    },
  ]);
  tray.setContextMenu(trayMenus);
};

app.on("ready", () => {
  mainWindowState = electronWindowState({
    defaultWidth: 500,
    defaultHeight: 800,
  });
  window = new BrowserWindow({
    width:
      (electronStorage.getSync("size") as any).width || mainWindowState.width,
    height:
      (electronStorage.getSync("size") as any).height || mainWindowState.height,
    x: (electronStorage.getSync("position") as any).x || mainWindowState.x,
    y: (electronStorage.getSync("position") as any).y || mainWindowState.y,
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
  process.env.DEBUG && window.webContents.openDevTools({ mode: "undocked" });
  interval = setInterval(() => {
    savePosition();
    saveSize();
  }, 500);
  mainWindowState.manage(window);

  const trayIconImage = nativeImage.createFromPath(
    path.resolve(__dirname, "logo.png")
  );
  tray = new Tray(trayIconImage.resize({ width: 16, height: 16 }));
  tray.setToolTip(getTitleAndVersion());
  setTrayContextMenu();
  fs.watch(BridgeBBCCThemeDirPath, setTrayContextMenu);
});

app.on("will-quit", () => {
  clearInterval(interval);
});
