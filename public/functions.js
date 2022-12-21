"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setStorageValue = exports.getStorageValue = void 0;
const electron_json_storage_1 = __importDefault(require("electron-json-storage"));
const getStorageValue = (key) => electron_json_storage_1.default.getSync(key);
exports.getStorageValue = getStorageValue;
const setStorageValue = (key, value, cb) => {
    if (cb)
        electron_json_storage_1.default.set(key, value, cb);
    else
        electron_json_storage_1.default.set(key, value, () => { });
};
exports.setStorageValue = setStorageValue;
