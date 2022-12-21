import electronStorage from "electron-json-storage";

export const getStorageValue = <T extends keyof localStorage>(key: T) =>
  electronStorage.getSync(key) as localStorage[T];

export const setStorageValue = <T extends keyof localStorage>(
  key: T,
  value: localStorage[T],
  cb?: () => void
) => {
  if (cb) electronStorage.set(key, value, cb);
  else electronStorage.set(key, value, () => {});
};
