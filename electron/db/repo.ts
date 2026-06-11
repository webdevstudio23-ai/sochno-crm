import { getDb } from "./index";

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);

/* ------------------------------- ЛИДЫ ------------------------------- */

function rowToLead(l: any, notes: any[]) {
  return {
    id: l.id,
    name: l.name,
    phone: l.phone,
    site: l.site,
    budget: l.budget,
    source: l.source,
    messenger: l.messenger,
    contact: l.contact,
    status: l.status,
    createdAt: l.created_at,
    notes,
  };
}

/** Список лидов, каждый — вместе с массивом notes (как ждёт прототип). */
export function listLeads() {
  const db = getDb();
  const leads = db.prepare("SELECT * FROM leads ORDER BY rowid ASC").all() as any[];
  const notesStmt = db.prepare(
    "SELECT id, text, at FROM lead_notes WHERE lead_id = ? ORDER BY at DESC"
  );
  return leads.map((l) => rowToLead(l, notesStmt.all(l.id)));
}

export function getLead(id: string) {
  const db = getDb();
  const l = db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as any;
  if (!l) return null;
  const notes = db
    .prepare("SELECT id, text, at FROM lead_notes WHERE lead_id = ? ORDER BY at DESC")
    .all(id);
  return rowToLead(l, notes);
}

/**
 * Upsert лида. Если в объекте пришёл массив notes (карточка лида в прототипе
 * редактирует заметки внутри формы) — синхронизируем lead_notes под него.
 */
export function saveLead(lead: any) {
  const db = getDb();
  const row = {
    id: lead.id,
    name: lead.name ?? "",
    phone: lead.phone ?? "",
    site: lead.site ?? "",
    budget: Math.round(lead.budget ?? 0),
    source: lead.source ?? "Fl.ru",
    messenger: lead.messenger ?? "Telegram",
    contact: lead.contact ?? "",
    status: lead.status ?? "Новый",
    created_at: lead.createdAt ?? todayISO(),
  };

  const run = db.transaction(() => {
    db.prepare(
      `INSERT INTO leads (id,name,phone,site,budget,source,messenger,contact,status,created_at)
       VALUES (@id,@name,@phone,@site,@budget,@source,@messenger,@contact,@status,@created_at)
       ON CONFLICT(id) DO UPDATE SET
         name=@name, phone=@phone, site=@site, budget=@budget, source=@source,
         messenger=@messenger, contact=@contact, status=@status`
    ).run(row);

    if (Array.isArray(lead.notes)) {
      const keepIds = lead.notes.map((n: any) => n.id).filter(Boolean);
      const existing = db
        .prepare("SELECT id FROM lead_notes WHERE lead_id = ?")
        .all(lead.id) as any[];
      for (const e of existing) {
        if (!keepIds.includes(e.id)) {
          db.prepare("DELETE FROM lead_notes WHERE id = ?").run(e.id);
        }
      }
      const up = db.prepare(
        `INSERT INTO lead_notes (id,lead_id,text,at) VALUES (@id,@lead_id,@text,@at)
         ON CONFLICT(id) DO UPDATE SET text=@text, at=@at`
      );
      for (const n of lead.notes) {
        up.run({
          id: n.id || uid(),
          lead_id: lead.id,
          text: n.text ?? "",
          at: n.at || new Date().toISOString(),
        });
      }
    }
  });
  run();
  return getLead(lead.id);
}

export function removeLead(id: string) {
  getDb().prepare("DELETE FROM leads WHERE id = ?").run(id); // каскадно чистит lead_notes
}

/* ----------------------------- ЗАМЕТКИ ЛИДА ----------------------------- */

export function addNote(leadId: string, text: string) {
  const note = { id: uid(), lead_id: leadId, text, at: new Date().toISOString() };
  getDb()
    .prepare("INSERT INTO lead_notes (id,lead_id,text,at) VALUES (@id,@lead_id,@text,@at)")
    .run(note);
  return { id: note.id, text: note.text, at: note.at };
}

export function removeNote(id: string) {
  getDb().prepare("DELETE FROM lead_notes WHERE id = ?").run(id);
}

/* ----------------------------- ФИНАНСЫ ----------------------------- */

export function listTx() {
  return (getDb().prepare("SELECT * FROM transactions ORDER BY rowid ASC").all() as any[]).map(
    (t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date,
      comment: t.comment,
      leadId: t.lead_id,
    })
  );
}

export function saveTx(t: any) {
  const row = {
    id: t.id,
    type: t.type,
    amount: Math.round(t.amount ?? 0),
    category: t.category ?? "",
    date: t.date,
    comment: t.comment ?? "",
    lead_id: t.leadId ?? null,
  };
  getDb()
    .prepare(
      `INSERT INTO transactions (id,type,amount,category,date,comment,lead_id)
       VALUES (@id,@type,@amount,@category,@date,@comment,@lead_id)
       ON CONFLICT(id) DO UPDATE SET
         type=@type, amount=@amount, category=@category, date=@date, comment=@comment, lead_id=@lead_id`
    )
    .run(row);
  return { ...t };
}

export function removeTx(id: string) {
  getDb().prepare("DELETE FROM transactions WHERE id = ?").run(id);
}

/* ------------------------------- СЕЙФ ------------------------------- */

export function allVault() {
  const db = getDb();
  return {
    passwords: db.prepare("SELECT * FROM vault_passwords ORDER BY rowid ASC").all(),
    notes: (db.prepare("SELECT * FROM vault_notes ORDER BY rowid ASC").all() as any[]).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      createdAt: n.created_at,
    })),
    tasks: (db.prepare("SELECT * FROM vault_tasks ORDER BY rowid ASC").all() as any[]).map((t) => ({
      id: t.id,
      title: t.title,
      done: !!t.done,
      due: t.due,
    })),
    docs: db.prepare("SELECT * FROM vault_docs ORDER BY rowid ASC").all(),
  };
}

export function savePassword(p: any) {
  getDb()
    .prepare(
      `INSERT INTO vault_passwords (id,title,login,password,url,note)
       VALUES (@id,@title,@login,@password,@url,@note)
       ON CONFLICT(id) DO UPDATE SET title=@title, login=@login, password=@password, url=@url, note=@note`
    )
    .run({
      id: p.id,
      title: p.title ?? "",
      login: p.login ?? "",
      password: p.password ?? "",
      url: p.url ?? "",
      note: p.note ?? "",
    });
}
export function removePassword(id: string) {
  getDb().prepare("DELETE FROM vault_passwords WHERE id = ?").run(id);
}

export function saveVaultNote(n: any) {
  getDb()
    .prepare(
      `INSERT INTO vault_notes (id,title,body,created_at)
       VALUES (@id,@title,@body,@created_at)
       ON CONFLICT(id) DO UPDATE SET title=@title, body=@body`
    )
    .run({ id: n.id, title: n.title ?? "", body: n.body ?? "", created_at: n.createdAt ?? todayISO() });
}
export function removeVaultNote(id: string) {
  getDb().prepare("DELETE FROM vault_notes WHERE id = ?").run(id);
}

export function saveTask(t: any) {
  getDb()
    .prepare(
      `INSERT INTO vault_tasks (id,title,done,due)
       VALUES (@id,@title,@done,@due)
       ON CONFLICT(id) DO UPDATE SET title=@title, done=@done, due=@due`
    )
    .run({ id: t.id, title: t.title ?? "", done: t.done ? 1 : 0, due: t.due ?? null });
}
export function removeTask(id: string) {
  getDb().prepare("DELETE FROM vault_tasks WHERE id = ?").run(id);
}

export function saveDoc(d: any) {
  getDb()
    .prepare(
      `INSERT INTO vault_docs (id,title,link,note)
       VALUES (@id,@title,@link,@note)
       ON CONFLICT(id) DO UPDATE SET title=@title, link=@link, note=@note`
    )
    .run({ id: d.id, title: d.title ?? "", link: d.link ?? "", note: d.note ?? "" });
}
export function removeDoc(id: string) {
  getDb().prepare("DELETE FROM vault_docs WHERE id = ?").run(id);
}
