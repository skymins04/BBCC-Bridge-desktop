"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BridgeBBCCClientHTMLPath = exports.BridgeBBCCThemeDirPath = exports.BridgeBBCCLibDirPath = exports.BridgeBBCCConfigFilePath = exports.BridgeBBCCRootDirPath = exports.logoImagePath = exports.version = exports.title = void 0;
const path_1 = __importDefault(require("path"));
exports.title = "BridgeBBCC Desktop";
exports.version = "v1.0.1";
exports.logoImagePath = path_1.default.resolve(__dirname, "logo.png");
exports.BridgeBBCCRootDirPath = path_1.default.resolve(__dirname, "BridgeBBCC");
exports.BridgeBBCCConfigFilePath = path_1.default.join(exports.BridgeBBCCRootDirPath, "lib", "config.js");
exports.BridgeBBCCLibDirPath = path_1.default.join(exports.BridgeBBCCRootDirPath, "lib");
exports.BridgeBBCCThemeDirPath = path_1.default.join(exports.BridgeBBCCRootDirPath, "theme");
exports.BridgeBBCCClientHTMLPath = path_1.default.join(exports.BridgeBBCCRootDirPath, "client.html");
