import { app, dialog, BrowserWindow } from "electron";
import electronUpdater from "electron-updater";

const { autoUpdater } = electronUpdater;

let manualCheck = false;

/**
 * Подключает автообновление через GitHub Releases.
 * Вызывать после создания окна. В dev-режиме (не запакованное приложение) ничего не делает.
 */
export function initAutoUpdate() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", (info) => {
    if (manualCheck) {
      dialog.showMessageBox({
        type: "info",
        title: "Доступно обновление",
        message: `Найдена новая версия ${info.version}.`,
        detail: "Обновление загружается в фоне. Когда будет готово — предложу перезапустить.",
        buttons: ["Ок"],
      });
      manualCheck = false;
    }
  });

  autoUpdater.on("update-not-available", () => {
    if (manualCheck) {
      dialog.showMessageBox({
        type: "info",
        title: "Обновлений нет",
        message: "У вас установлена последняя версия.",
        buttons: ["Ок"],
      });
      manualCheck = false;
    }
  });

  autoUpdater.on("error", (err) => {
    if (manualCheck) {
      dialog.showMessageBox({
        type: "error",
        title: "Ошибка обновления",
        message: "Не удалось проверить обновления.",
        detail: String(err == null ? "неизвестная ошибка" : (err.message || err)),
        buttons: ["Ок"],
      });
      manualCheck = false;
    }
  });

  autoUpdater.on("update-downloaded", async (info) => {
    const win = BrowserWindow.getAllWindows()[0];
    const res = await dialog.showMessageBox(win, {
      type: "question",
      title: "Обновление готово",
      message: `Версия ${info.version} загружена.`,
      detail: "Перезапустить приложение сейчас, чтобы установить обновление? Ваши данные сохранятся.",
      buttons: ["Перезапустить", "Позже"],
      defaultId: 0,
      cancelId: 1,
    });
    if (res.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  // тихая проверка при старте
  autoUpdater.checkForUpdates().catch(() => { /* молча: сеть/токен и т.п. */ });
}

/** Ручная проверка обновлений (из меню) — с диалогами-ответами. */
export function checkForUpdatesManually() {
  if (!app.isPackaged) {
    dialog.showMessageBox({
      type: "info",
      title: "Обновления",
      message: "Проверка обновлений доступна только в установленном приложении.",
      buttons: ["Ок"],
    });
    return;
  }
  manualCheck = true;
  autoUpdater.checkForUpdates().catch(() => { /* событие error покажет диалог */ });
}
