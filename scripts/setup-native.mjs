// Подготовка нативного модуля better-sqlite3 под ABI Electron — БЕЗ компиляции.
// Скачивает готовый prebuilt-бинарник для установленной версии Electron.
// Если готового бинарника нет, как запасной вариант пробует electron-rebuild
// (которому уже нужен C++ компилятор).
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sqliteDir = path.join(root, "node_modules", "better-sqlite3");

if (!existsSync(sqliteDir)) {
  console.log("[setup-native] better-sqlite3 ещё не установлен — пропускаю.");
  process.exit(0);
}

function electronVersion() {
  try {
    const pkg = JSON.parse(
      readFileSync(path.join(root, "node_modules", "electron", "package.json"), "utf8")
    );
    return pkg.version;
  } catch {
    return null;
  }
}

const ev = electronVersion();
if (!ev) {
  console.log("[setup-native] не нашёл установленный electron — пропускаю.");
  process.exit(0);
}

console.log(`[setup-native] better-sqlite3 -> prebuilt для Electron ${ev}`);

try {
  execSync(`npx --no-install prebuild-install -r electron -t ${ev} --arch x64`, {
    cwd: sqliteDir,
    stdio: "inherit",
  });
  console.log("[setup-native] готовый бинарник установлен ✓");
  process.exit(0);
} catch {
  console.warn("[setup-native] prebuilt не найден, пробую electron-rebuild (нужен компилятор C++)…");
}

try {
  execSync(`npx --no-install electron-rebuild -f -w better-sqlite3 -v ${ev}`, {
    cwd: root,
    stdio: "inherit",
  });
  console.log("[setup-native] пересборка завершена ✓");
} catch {
  console.warn(
    "[setup-native] не удалось подготовить better-sqlite3 автоматически.\n" +
      "  Решения: 1) выполнить `npm run setup-native` при наличии интернета;\n" +
      "           2) установить «Desktop development with C++» (Visual Studio Build Tools) и `npx electron-rebuild`."
  );
}
// Никогда не валим установку из-за нативного шага — выходим успешно.
process.exit(0);
