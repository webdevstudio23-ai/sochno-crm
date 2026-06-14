import Database from "better-sqlite3";
import { app } from "electron";
import path from "node:path";
import schema from "./schema.sql?raw";

let db: Database.Database | null = null;

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);

/** Путь к файлу базы внутри userData (переживает перезапуск). */
export function dbFilePath(): string {
  return path.join(app.getPath("userData"), "sochno.db");
}

/** Открыть базу (один раз), включить WAL + foreign_keys, прогнать схему. */
export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(dbFilePath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(schema);
  return db;
}

/**
 * При первом запуске (никогда раньше не сеяли) заливает демо-данные, чтобы UI
 * не был пустым. После — ставит флаг в meta, чтобы повторно НЕ заливать демо-
 * данные, даже если пользователь позже удалит все свои записи.
 */
export function seedIfEmpty(): void {
  const d = getDb();
  const already = d.prepare("SELECT value FROM meta WHERE key = 'seeded'").get() as
    | { value: string }
    | undefined;
  if (already) return;

  const { c } = d.prepare("SELECT COUNT(*) AS c FROM leads").get() as { c: number };
  if (c > 0) {
    d.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('seeded', '1')").run();
    return;
  }

  const now = () => new Date().toISOString();

  const seed = d.transaction(() => {
    const leadIns = d.prepare(
      `INSERT INTO leads (id,name,phone,site,budget,source,messenger,contact,status,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    );
    const noteIns = d.prepare(
      `INSERT INTO lead_notes (id,lead_id,text,at) VALUES (?,?,?,?)`
    );

    const l1 = uid(), l2 = uid(), l3 = uid(), l4 = uid();

    leadIns.run(l1, "Иван Петров", "+7 918 000-11-22", "petrov-clinic.ru", 120000, "Fl.ru", "Telegram", "@petrov", "Прототип", todayISO());
    noteIns.run(uid(), l1, "Нужен лендинг для клиники, торопится к запуску рекламы.", now());

    leadIns.run(l2, "ООО «Модтех»", "+7 861 555-33-10", "modteh.ru", 240000, "База ИП", "WhatsApp", "+79610000000", "Договор", todayISO());
    noteIns.run(uid(), l2, "Модульные дома, согласовали смету.", now());

    leadIns.run(l3, "Анна Кворк", "", "", 50000, "Kwork", "Max", "anna_k", "Переговоры", todayISO());
    noteIns.run(uid(), l3, "Просит правки по прототипу.", now());

    leadIns.run(l4, "Сергей TG", "+7 900 123-45-67", "—", 70000, "Telegram", "Telegram", "@sergey_dev", "Новый", todayISO());

    const txIns = d.prepare(
      `INSERT INTO transactions (id,type,amount,category,date,comment,lead_id) VALUES (?,?,?,?,?,?,?)`
    );
    txIns.run(uid(), "income", 145000, "", todayISO(), "Предоплата по проекту Your Smile", null);
    txIns.run(uid(), "expense", 12000, "Реклама", todayISO(), "Яндекс Директ", null);
    txIns.run(uid(), "expense", 4500, "Подписки", todayISO(), "Figma + хостинг", null);
    txIns.run(uid(), "income", 60000, "", todayISO(), "Этап 1 — Модтех", l2);

    d.prepare(`INSERT INTO vault_passwords (id,title,login,password,url,note) VALUES (?,?,?,?,?,?)`)
      .run(uid(), "reg.ru VDS", "root", "S0chn0-demo!", "reg.ru", "Ubuntu 24.04, 2vCPU/2GB");

    d.prepare(`INSERT INTO vault_notes (id,title,body,created_at) VALUES (?,?,?,?)`)
      .run(uid(), "Идея для блока кейсов", "Добавить видео-обложки .webm как на главной.", todayISO());

    const taskIns = d.prepare(`INSERT INTO vault_tasks (id,title,done,due) VALUES (?,?,?,?)`);
    taskIns.run(uid(), "Отправить КП клинике Петрова", 0, todayISO());
    taskIns.run(uid(), "Созвон с Модтех по договору", 0, todayISO());
    taskIns.run(uid(), "Выставить счёт за этап 1", 1, todayISO());

    d.prepare(`INSERT INTO vault_docs (id,title,link,note) VALUES (?,?,?,?)`)
      .run(uid(), "Бриф Modteh.pdf", "", "Заполненный бриф клиента");

    d.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('seeded', '1')").run();
  });

  seed();
}
