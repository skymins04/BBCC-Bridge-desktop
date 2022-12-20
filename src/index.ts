import { app, BrowserWindow, Menu, shell, Tray } from "electron";
import electronWindowState from "electron-window-state";
import electronStorage from "electron-json-storage";
import fs from "fs";
import path from "path";

let window: BrowserWindow;
let tray: Tray;
let mainWindowState: electronWindowState.State;
let interval: NodeJS.Timer;

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
  const configFile = fs
    .readFileSync(`./public/BridgeBBCC/lib/config.js`)
    .toString();
  fs.writeFileSync(
    `./public/BridgeBBCC/lib/config.js`,
    configFile.replace(/(?<=theme *\: *\").*(?=\"\,)/gm, themeName)
  );
  window.reload();
};

const checkCurrentTheme = () => {
  const configFile = fs
    .readFileSync(`./public/BridgeBBCC/lib/config.js`)
    .toString();
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
    .readdirSync(`./public/BridgeBBCC/theme`)
    .filter((x) => x !== "default")
    .map((x) => ({
      label: x,
      type: "radio",
      click: () => changeTheme(x),
      checked: currentTheme === x,
    }));
  const trayMenus = Menu.buildFromTemplate([
    { label: "BridgeBBCC Desktop v1.0.0", type: "normal" },
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
      click: () => shell.openPath(path.resolve(__dirname, "BridgeBBCC", "lib")),
    },
    {
      label: "테마폴더 열기",
      type: "normal",
      click: () =>
        shell.openPath(path.resolve(__dirname, "BridgeBBCC", "theme")),
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
  window.loadFile(`./public/BridgeBBCC/client.html`);
  window.setAlwaysOnTop(true);
  window.setTitle("BridgeBBCC Desktop");
  process.env.DEBUG && window.webContents.openDevTools({ mode: "undocked" });

  interval = setInterval(() => {
    savePosition();
    saveSize();
  }, 500);
  mainWindowState.manage(window);

  tray = new Tray(`./public/logo.png`);

  tray.setToolTip("BridgeBBCC Desktop v1.0.0");

  setTrayContextMenu();
  fs.watch(path.resolve(__dirname, "BridgeBBCC", "theme"), setTrayContextMenu);
});

app.on("will-quit", () => {
  clearInterval(interval);
});
