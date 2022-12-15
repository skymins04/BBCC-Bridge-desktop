import { app, BrowserWindow, session } from "electron";
import electronWindowState from "electron-window-state";
import electronStorage from "electron-json-storage";

let window;

app.on("ready", () => {
  const mainWindowState = electronWindowState({
    defaultWidth: 500,
    defaultHeight: 800,
  });
  window = new BrowserWindow({
    width: mainWindowState.width,
    height: mainWindowState.height,
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

  window.on("moved", () => {
    electronStorage.set(
      "position",
      { x: mainWindowState.x, y: mainWindowState.y },
      process.env.DEBUG
        ? () => {
            console.log("saved", {
              x: mainWindowState.x,
              y: mainWindowState.y,
            });
          }
        : () => {}
    );
  });
  mainWindowState.manage(window);
});
