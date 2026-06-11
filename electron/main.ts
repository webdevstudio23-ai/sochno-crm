import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from "electron";
import path from "node:path";
import fs from "node:fs";
import { getDb, seedIfEmpty, dbFilePath } from "./db";
import * as repo from "./db/repo";
import { initAutoUpdate, checkForUpdatesManually } from "./updater";

const DEV_URL = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 940,
    minHeight: 600,
    backgroundColor: "#F6F2E9",
    title: "СОЧНО CRM",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (DEV_URL) {
    win.loadURL(DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  return win;
}

/* ----------------------------- бэкап базы ----------------------------- */

async function exportDb(): Promise<string> {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Экспорт базы данных",
    defaultPath: `sochno-backup-${new Date().toISOString().slice(0, 10)}.db`,
    filters: [{ name: "SQLite база", extensions: ["db"] }],
  });
  if (canceled || !filePath) return "";
  // свести WAL в основной файл, чтобы копия была целостной
  getDb().pragma("wal_checkpoint(TRUNCATE)");
  fs.copyFileSync(dbFilePath(), filePath);
  return filePath;
}

function revealDb(): void {
  shell.showItemInFolder(dbFilePath());
}

/* ----------------------------- регистрация IPC ----------------------------- */

function registerIpc() {
  // лиды
  ipcMain.handle("leads:list", () => repo.listLeads());
  ipcMain.handle("leads:save", (_e, lead) => repo.saveLead(lead));
  ipcMain.handle("leads:remove", (_e, id) => repo.removeLead(id));

  // заметки лида
  ipcMain.handle("notes:add", (_e, leadId, text) => repo.addNote(leadId, text));
  ipcMain.handle("notes:remove", (_e, id) => repo.removeNote(id));

  // финансы
  ipcMain.handle("tx:list", () => repo.listTx());
  ipcMain.handle("tx:save", (_e, t) => repo.saveTx(t));
  ipcMain.handle("tx:remove", (_e, id) => repo.removeTx(id));

  // сейф
  ipcMain.handle("vault:all", () => repo.allVault());
  ipcMain.handle("vault:savePassword", (_e, p) => repo.savePassword(p));
  ipcMain.handle("vault:removePassword", (_e, id) => repo.removePassword(id));
  ipcMain.handle("vault:saveNote", (_e, n) => repo.saveVaultNote(n));
  ipcMain.handle("vault:removeNote", (_e, id) => repo.removeVaultNote(id));
  ipcMain.handle("vault:saveTask", (_e, t) => repo.saveTask(t));
  ipcMain.handle("vault:removeTask", (_e, id) => repo.removeTask(id));
  ipcMain.handle("vault:saveDoc", (_e, d) => repo.saveDoc(d));
  ipcMain.handle("vault:removeDoc", (_e, id) => repo.removeDoc(id));

  // бэкап
  ipcMain.handle("backup:export", () => exportDb());
  ipcMain.handle("backup:reveal", () => revealDb());
}

/* ----------------------------- меню приложения ----------------------------- */

function buildMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Файл",
      submenu: [
        { label: "Экспорт базы…", click: () => exportDb() },
        { label: "Показать файл базы", click: () => revealDb() },
        { type: "separator" },
        { label: "Проверить обновления…", click: () => checkForUpdatesManually() },
        { type: "separator" },
        { role: "quit", label: "Выход" },
      ],
    },
    {
      label: "Правка",
      submenu: [
        { role: "undo", label: "Отменить" },
        { role: "redo", label: "Повторить" },
        { type: "separator" },
        { role: "cut", label: "Вырезать" },
        { role: "copy", label: "Копировать" },
        { role: "paste", label: "Вставить" },
        { role: "selectAll", label: "Выделить всё" },
      ],
    },
    {
      label: "Вид",
      submenu: [
        { role: "reload", label: "Перезагрузить" },
        { role: "toggleDevTools", label: "Инструменты разработчика" },
        { type: "separator" },
        { role: "resetZoom", label: "Масштаб 100%" },
        { role: "zoomIn", label: "Увеличить" },
        { role: "zoomOut", label: "Уменьшить" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Полный экран" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ----------------------------- жизненный цикл ----------------------------- */

app.whenReady().then(() => {
  getDb();
  seedIfEmpty();
  registerIpc();
  buildMenu();
  createWindow();
  initAutoUpdate();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
