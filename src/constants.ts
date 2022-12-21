import path from "path";

export const title = "BridgeBBCC Desktop";
export const version = "v1.0.2";
export const logoImagePath = path.resolve(__dirname, "logo.png");

export const BridgeBBCCRootDirPath = path.resolve(__dirname, "BridgeBBCC");
export const BridgeBBCCConfigFilePath = path.join(
  BridgeBBCCRootDirPath,
  "lib",
  "config.js"
);
export const BridgeBBCCLibDirPath = path.join(BridgeBBCCRootDirPath, "lib");
export const BridgeBBCCThemeDirPath = path.join(BridgeBBCCRootDirPath, "theme");
export const BridgeBBCCClientHTMLPath = path.join(
  BridgeBBCCRootDirPath,
  "client.html"
);
