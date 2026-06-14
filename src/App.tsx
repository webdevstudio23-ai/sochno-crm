import React, { useState, useEffect } from "react";
import {
  LayoutGrid, Users, Columns, Wallet, Shield, Plus, Search, X, Pencil,
  Trash2, Check, Eye, EyeOff, Phone, Globe, MessageSquare, FileText,
  StickyNote, CheckSquare, ArrowUpRight, ArrowDownRight, Link2, Calendar,
  Copy, ClipboardList, Table2, FileSpreadsheet, Upload, ArrowLeft
} from "lucide-react";
import { api } from "./api";

/* ----------------------------- настройки домена ----------------------------- */
const STATUSES = [
  { id: "Новый", short: "Новый", dot: "#9A9385" },
  { id: "Переговоры", short: "Переговоры", dot: "#C9A227" },
  { id: "Коммерческое предложение", short: "КП", dot: "#D2691E" },
  { id: "Прототип", short: "Прототип", dot: "#6A8EAE" },
  { id: "Договор", short: "Договор", dot: "#5B8C5A" },
  { id: "Оплата", short: "Оплата", dot: "#2F8F4E" },
  { id: "Закрыт", short: "Закрыт", dot: "#1F7A3D" },
  { id: "Думает", short: "Думает", dot: "#B0AAA0" },
  { id: "Отказался", short: "Отказался", dot: "#C24A3A" },
];
const STATUS_DOT = Object.fromEntries(STATUSES.map((s) => [s.id, s.dot]));
const CHANNELS = ["Fl.ru", "Kwork", "База ИП", "Telegram"];
const EXPENSE_CATS = ["Реклама", "Подписки", "Сервисы", "Личное", "Оплата труда", "Обязательные расходы", "Прочее"];
const MESSENGERS = ["Telegram", "WhatsApp", "Max", "Телефон", "Email"];
const ACTIVE_STATUSES = ["Новый", "Переговоры", "Коммерческое предложение", "Прототип", "Договор", "Оплата"];

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n || 0)) + " ₽";

/* ----------------------------- мелкие UI-компоненты ----------------------------- */
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="sc-overlay" onMouseDown={onClose}>
      <div className={"sc-modal" + (wide ? " wide" : "")} onMouseDown={(e) => e.stopPropagation()}>
        <div className="sc-modal-head">
          <h3>{title}</h3>
          <button className="sc-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="sc-modal-body">{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (<label className="sc-field"><span>{label}</span>{children}</label>);
}
function StatusPill({ status }) {
  return (
    <span className="sc-pill">
      <i style={{ background: STATUS_DOT[status] || "#999" }} />
      {STATUSES.find((s) => s.id === status)?.short || status}
    </span>
  );
}

/* ================================ APP ================================ */
export default function App() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("dashboard");
  const [leads, setLeads] = useState([]);
  const [tx, setTx] = useState([]);
  const [vault, setVault] = useState({ passwords: [], notes: [], tasks: [], docs: [] });

  /* загрузка из локальной базы (SQLite через window.crm) */
  useEffect(() => {
    (async () => {
      setLeads(await api.leads.list());
      setTx(await api.tx.list());
      setVault(await api.vault.all());
      setReady(true);
    })();
  }, []);

  /* сохранение: оптимистично обновляем state и синхронизируем базу */
  const upLeads = (next) => { const prev = leads; setLeads(next); api.leads.persist(prev, next); };
  const upTx = (next) => { const prev = tx; setTx(next); api.tx.persist(prev, next); };
  const upVault = (next) => { const prev = vault; setVault(next); api.vault.persist(prev, next); };

  const NAV = [
    { id: "dashboard", label: "Дашборд", icon: LayoutGrid },
    { id: "leads", label: "Лиды", icon: Users },
    { id: "funnels", label: "Воронки", icon: Columns },
    { id: "finance", label: "Финансы", icon: Wallet },
    { id: "vault", label: "Сейф", icon: Shield },
    { id: "sheets", label: "Таблицы", icon: Table2 },
  ];

  return (
    <div className="sc-root">
      {/* сайдбар */}
      <aside className="sc-side">
        <div className="sc-logo">сочно<i /></div>
        <nav>
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = view === n.id;
            return (
              <button key={n.id} className={"sc-nav" + (active ? " active" : "")} onClick={() => setView(n.id)}>
                <Icon size={18} strokeWidth={2.4} />
                <span>{n.label}</span>
                {active && <em className="sc-nav-dot" />}
              </button>
            );
          })}
        </nav>
        <div className="sc-side-foot">
          <span className="sc-eyebrow">CRM · студия</span>
          <span className="sc-muted-s">данные хранятся локально</span>
          <div className="sc-backup">
            <button className="sc-link" onClick={() => api.backup.export()}>Экспорт базы</button>
            <button className="sc-link" onClick={() => api.backup.reveal()}>Показать файл базы</button>
          </div>
        </div>
      </aside>

      {/* контент */}
      <main className="sc-main">
        {!ready ? (
          <div className="sc-loading">Загружаю данные…</div>
        ) : (
          <>
          <div className="sc-anim" key={view}>
            {view === "dashboard" && <Dashboard leads={leads} tx={tx} vault={vault} upVault={upVault} setView={setView} />}
            {view === "leads" && <Leads leads={leads} upLeads={upLeads} />}
            {view === "funnels" && <Funnels leads={leads} upLeads={upLeads} />}
            {view === "finance" && <Finance tx={tx} upTx={upTx} leads={leads} />}
            {view === "vault" && <VaultView vault={vault} upVault={upVault} />}
            {view === "sheets" && <Spreadsheets />}
          </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ================================ DASHBOARD ================================ */
function Dashboard({ leads, tx, vault, upVault, setView }) {
  const now = new Date();
  const month = now.getMonth(), year = now.getFullYear();
  const greet = now.getHours() < 6 ? "Доброй ночи" : now.getHours() < 12 ? "Доброе утро" : now.getHours() < 18 ? "Добрый день" : "Добрый вечер";

  const incomeMonth = tx.filter((t) => t.type === "income" && new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year).reduce((s, t) => s + t.amount, 0);
  const inWork = leads.filter((l) => ACTIVE_STATUSES.includes(l.status)).length;
  const overdue = vault.tasks.filter((t) => !t.done && t.due < todayISO());
  const todays = vault.tasks.filter((t) => !t.done && t.due === todayISO());
  const dueTasks = [...overdue, ...todays];
  const recent = [...leads].slice(-5).reverse();

  const toggleTask = (id) => {
    const tasks = vault.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t);
    upVault({ ...vault, tasks });
  };

  return (
    <div className="sc-view">
      <header className="sc-hero">
        <span className="sc-eyebrow">СОЧНО · {now.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</span>
        <h1>{greet}<i className="sc-red-dot" /></h1>
        <p>Сводка по студии на сегодня. Всё под рукой.</p>
      </header>

      <div className="sc-stats">
        <Stat label="Выручка за месяц" value={fmt(incomeMonth)} hint="доход, текущий месяц" icon={ArrowUpRight} accent onClick={() => setView("finance")} />
        <Stat label="Заказов в работе" value={inWork} hint="активные сделки" icon={Columns} onClick={() => setView("funnels")} />
        <Stat label="Задания на сегодня" value={dueTasks.length} hint={overdue.length ? `${overdue.length} просрочено` : "незакрытые задачи"} icon={ClipboardList} onClick={() => setView("vault")} />
      </div>

      <div className="sc-grid-2">
        <section className="sc-card">
          <div className="sc-card-head"><h2>Задания на сегодня</h2><button className="sc-link" onClick={() => setView("vault")}>в сейф →</button></div>
          {dueTasks.length === 0 ? (
            <div className="sc-empty">На сегодня всё закрыто. Можно ставить новые задачи в разделе «Сейф».</div>
          ) : (
            <ul className="sc-tasklist">
              {dueTasks.map((t) => {
                const late = t.due < todayISO();
                return (
                  <li key={t.id}>
                    <button className="sc-check" onClick={() => toggleTask(t.id)}><Check size={13} /></button>
                    <span>{t.title}</span>
                    {late && <em className="sc-late">просрочено · {new Date(t.due).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</em>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="sc-card">
          <div className="sc-card-head"><h2>Последние лиды</h2><button className="sc-link" onClick={() => setView("leads")}>все лиды →</button></div>
          <ul className="sc-recent">
            {recent.map((l) => (
              <li key={l.id}>
                <div><strong>{l.name}</strong><span className="sc-muted-s">{l.source} · {fmt(l.budget)}</span></div>
                <StatusPill status={l.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
function Stat({ label, value, hint, icon: Icon, accent, onClick }) {
  return (
    <button className={"sc-stat" + (accent ? " accent" : "")} onClick={onClick}>
      <div className="sc-stat-top"><span>{label}</span><Icon size={18} /></div>
      <div className="sc-stat-val">{value}</div>
      <div className="sc-stat-hint">{hint}</div>
    </button>
  );
}

/* ================================ LEADS ================================ */
function emptyLead() {
  return { id: uid(), name: "", phone: "", site: "", budget: 0, source: "Fl.ru", messenger: "Telegram", contact: "", status: "Новый", notes: [], createdAt: todayISO() };
}
function Leads({ leads, upLeads }) {
  const [q, setQ] = useState("");
  const [src, setSrc] = useState("Все");
  const [editing, setEditing] = useState(null);

  const filtered = leads.filter((l) =>
    (src === "Все" || l.source === src) &&
    (l.name.toLowerCase().includes(q.toLowerCase()) || (l.contact || "").toLowerCase().includes(q.toLowerCase()))
  ).reverse();

  const save = (lead) => {
    const exists = leads.some((l) => l.id === lead.id);
    upLeads(exists ? leads.map((l) => l.id === lead.id ? lead : l) : [...leads, lead]);
    setEditing(null);
  };
  const remove = (id) => upLeads(leads.filter((l) => l.id !== id));

  return (
    <div className="sc-view">
      <ViewHead title="Лиды" sub={`${leads.length} контактов в базе`} onAdd={() => setEditing(emptyLead())} addLabel="Новый лид" />
      <div className="sc-toolbar">
        <div className="sc-search"><Search size={16} /><input placeholder="Поиск по имени или контакту" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="sc-chips">
          {["Все", ...CHANNELS].map((c) => (
            <button key={c} className={"sc-chip" + (src === c ? " on" : "")} onClick={() => setSrc(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="sc-card sc-tablewrap">
        <table className="sc-table">
          <thead><tr><th>Имя</th><th>Источник</th><th>Бюджет</th><th>Статус</th><th>Контакт</th><th></th></tr></thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} onClick={() => setEditing(l)}>
                <td><strong>{l.name || "—"}</strong>{l.site ? <span className="sc-muted-s">{l.site}</span> : null}</td>
                <td>{l.source}</td>
                <td>{fmt(l.budget)}</td>
                <td><StatusPill status={l.status} /></td>
                <td><span className="sc-muted">{l.messenger}: {l.contact || "—"}</span></td>
                <td className="sc-row-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="sc-icon-btn" onClick={() => setEditing(l)}><Pencil size={15} /></button>
                  <button className="sc-icon-btn danger" onClick={() => remove(l.id)}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6}><div className="sc-empty">Ничего не нашлось. Добавьте лид кнопкой «Новый лид».</div></td></tr>}
          </tbody>
        </table>
      </div>

      <LeadModal lead={editing} onClose={() => setEditing(null)} onSave={save} />
    </div>
  );
}
function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState(lead);
  const [draft, setDraft] = useState("");
  useEffect(() => { setForm(lead); setDraft(""); }, [lead]);
  if (!lead || !form) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const notes = form.notes || [];
  const addNote = () => {
    if (!draft.trim()) return;
    setForm((f) => ({ ...f, notes: [{ id: uid(), text: draft.trim(), at: new Date().toISOString() }, ...(f.notes || [])] }));
    setDraft("");
  };
  const delNote = (id) => setForm((f) => ({ ...f, notes: (f.notes || []).filter((n) => n.id !== id) }));
  const noteDate = (iso) => new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <Modal open={!!lead} onClose={onClose} title={lead.name ? `Лид · ${lead.name}` : "Новый лид"} wide>
      <div className="sc-form-grid">
        <Field label="Имя"><input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Имя клиента / компания" /></Field>
        <Field label="Телефон"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+7 ..." /></Field>
        <Field label="Сайт"><input value={form.site} onChange={(e) => set("site", e.target.value)} placeholder="example.ru" /></Field>
        <Field label="Бюджет, ₽"><input type="number" value={form.budget} onChange={(e) => set("budget", Number(e.target.value))} /></Field>
        <Field label="Источник">
          <select value={form.source} onChange={(e) => set("source", e.target.value)}>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Мессенджер">
          <select value={form.messenger} onChange={(e) => set("messenger", e.target.value)}>{MESSENGERS.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Контакт"><input value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="@username / номер" /></Field>
        <Field label="Статус">
          <select value={form.status} onChange={(e) => set("status", e.target.value)}>{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}</select>
        </Field>
      </div>

      <div className="sc-notes">
        <span className="sc-notes-ttl">История заметок</span>
        <div className="sc-note-add">
          <textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Добавить запись по клиенту… (Ctrl+Enter)" onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === "Enter" && addNote()} />
          <button className="sc-btn small" onClick={addNote}><Plus size={15} /> Добавить</button>
        </div>
        {notes.length === 0 ? (
          <div className="sc-empty">Пока нет заметок. Первая запись появится здесь с датой.</div>
        ) : (
          <ul className="sc-note-feed">
            {notes.map((n) => (
              <li key={n.id}>
                <div className="sc-note-meta"><i className="sc-red-dot small" /><span>{noteDate(n.at)}</span><button className="sc-icon-btn danger" onClick={() => delNote(n.id)}><Trash2 size={13} /></button></div>
                <p>{n.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sc-modal-foot">
        <button className="sc-btn ghost" onClick={onClose}>Отмена</button>
        <button className="sc-btn" onClick={() => onSave(form)}>Сохранить</button>
      </div>
    </Modal>
  );
}

/* ================================ FUNNELS (kanban) ================================ */
function Funnels({ leads, upLeads }) {
  const [chan, setChan] = useState("Все");
  const [drag, setDrag] = useState(null);

  const visible = leads.filter((l) => chan === "Все" || l.source === chan);
  const onDrop = (status) => {
    if (!drag) return;
    upLeads(leads.map((l) => l.id === drag ? { ...l, status } : l));
    setDrag(null);
  };

  return (
    <div className="sc-view">
      <ViewHead title="Воронки" sub="Перетаскивайте карточки между этапами" />
      <div className="sc-chips" style={{ marginBottom: 18 }}>
        {["Все", ...CHANNELS].map((c) => (
          <button key={c} className={"sc-chip" + (chan === c ? " on" : "")} onClick={() => setChan(c)}>{c}</button>
        ))}
      </div>
      <div className="sc-kanban">
        {STATUSES.map((s) => {
          const cards = visible.filter((l) => l.status === s.id);
          const sum = cards.reduce((a, l) => a + (l.budget || 0), 0);
          return (
            <div key={s.id} className="sc-col" onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(s.id)}>
              <div className="sc-col-head">
                <span><i style={{ background: s.dot }} />{s.short}</span>
                <em>{cards.length}</em>
              </div>
              <div className="sc-col-sum">{sum > 0 ? fmt(sum) : "—"}</div>
              <div className="sc-col-body">
                {cards.map((l) => (
                  <div key={l.id} className={"sc-kcard" + (drag === l.id ? " dragging" : "")} draggable onDragStart={() => setDrag(l.id)} onDragEnd={() => setDrag(null)}>
                    <strong>{l.name}</strong>
                    <span className="sc-muted-s">{l.source}</span>
                    <span className="sc-kbudget">{fmt(l.budget)}</span>
                  </div>
                ))}
                {cards.length === 0 && <div className="sc-col-empty">пусто</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================ FINANCE ================================ */
function emptyTx() { return { id: uid(), type: "expense", amount: 0, category: "Реклама", date: todayISO(), comment: "", leadId: null }; }
function Finance({ tx, upTx, leads }) {
  const [editing, setEditing] = useState(null);
  const [fType, setFType] = useState("Все");
  const now = new Date(), m = now.getMonth(), y = now.getFullYear();
  const inMonth = (t) => new Date(t.date).getMonth() === m && new Date(t.date).getFullYear() === y;
  const income = tx.filter((t) => t.type === "income" && inMonth(t)).reduce((s, t) => s + t.amount, 0);
  const expense = tx.filter((t) => t.type === "expense" && inMonth(t)).reduce((s, t) => s + t.amount, 0);

  const byCat = EXPENSE_CATS.map((c) => ({ c, sum: tx.filter((t) => t.type === "expense" && inMonth(t) && t.category === c).reduce((s, t) => s + t.amount, 0) })).filter((x) => x.sum > 0);
  const maxCat = Math.max(1, ...byCat.map((x) => x.sum));

  const list = [...tx].filter((t) => fType === "Все" || (fType === "Доход" ? t.type === "income" : t.type === "expense")).reverse();

  const save = (t) => {
    const exists = tx.some((x) => x.id === t.id);
    upTx(exists ? tx.map((x) => x.id === t.id ? t : x) : [...tx, t]);
    setEditing(null);
  };
  const remove = (id) => upTx(tx.filter((t) => t.id !== id));

  return (
    <div className="sc-view">
      <ViewHead title="Финансы" sub="Текущий месяц" onAdd={() => setEditing(emptyTx())} addLabel="Добавить операцию" />
      <div className="sc-stats">
        <Stat label="Доходы" value={fmt(income)} hint="за месяц" icon={ArrowUpRight} accent />
        <Stat label="Расходы" value={fmt(expense)} hint="за месяц" icon={ArrowDownRight} />
        <Stat label="Баланс" value={fmt(income - expense)} hint="доход − расход" icon={Wallet} />
      </div>

      <div className="sc-grid-2">
        <section className="sc-card">
          <div className="sc-card-head"><h2>Расходы по категориям</h2></div>
          {byCat.length === 0 ? <div className="sc-empty">Пока нет расходов в этом месяце.</div> : (
            <div className="sc-bars">
              {byCat.map((x) => (
                <div key={x.c} className="sc-bar-row">
                  <span className="sc-bar-label">{x.c}</span>
                  <div className="sc-bar-track"><div className="sc-bar-fill" style={{ width: (x.sum / maxCat * 100) + "%" }} /></div>
                  <span className="sc-bar-val">{fmt(x.sum)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="sc-card">
          <div className="sc-card-head"><h2>Операции</h2>
            <div className="sc-chips small">{["Все", "Доход", "Расход"].map((f) => <button key={f} className={"sc-chip" + (fType === f ? " on" : "")} onClick={() => setFType(f)}>{f}</button>)}</div>
          </div>
          <ul className="sc-txlist">
            {list.map((t) => {
              const lead = leads.find((l) => l.id === t.leadId);
              return (
                <li key={t.id}>
                  <span className={"sc-tx-icn " + t.type}>{t.type === "income" ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}</span>
                  <div className="sc-tx-main">
                    <strong>{t.type === "income" ? "Доход" : t.category}</strong>
                    <span className="sc-muted-s">{t.comment || "—"}{lead ? ` · сделка: ${lead.name}` : ""} · {new Date(t.date).toLocaleDateString("ru-RU")}</span>
                  </div>
                  <span className={"sc-tx-amount " + t.type}>{t.type === "income" ? "+" : "−"}{fmt(t.amount)}</span>
                  <span className="sc-row-actions">
                    <button className="sc-icon-btn" onClick={() => setEditing(t)}><Pencil size={14} /></button>
                    <button className="sc-icon-btn danger" onClick={() => remove(t.id)}><Trash2 size={14} /></button>
                  </span>
                </li>
              );
            })}
            {list.length === 0 && <div className="sc-empty">Операций нет. Добавьте первую кнопкой выше.</div>}
          </ul>
        </section>
      </div>

      <TxModal t={editing} onClose={() => setEditing(null)} onSave={save} leads={leads} />
    </div>
  );
}
function TxModal({ t, onClose, onSave, leads }) {
  const [form, setForm] = useState(t);
  useEffect(() => setForm(t), [t]);
  if (!t || !form) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal open={!!t} onClose={onClose} title="Операция">
      <div className="sc-seg">
        <button className={form.type === "income" ? "on" : ""} onClick={() => set("type", "income")}>Доход</button>
        <button className={form.type === "expense" ? "on" : ""} onClick={() => set("type", "expense")}>Расход</button>
      </div>
      <div className="sc-form-grid">
        <Field label="Сумма, ₽"><input type="number" value={form.amount} onChange={(e) => set("amount", Number(e.target.value))} /></Field>
        <Field label="Дата"><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
        {form.type === "expense" && (
          <Field label="Категория"><select value={form.category} onChange={(e) => set("category", e.target.value)}>{EXPENSE_CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
        )}
        <Field label="Привязать к сделке">
          <select value={form.leadId || ""} onChange={(e) => set("leadId", e.target.value || null)}>
            <option value="">— не привязывать —</option>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </Field>
        <div className="sc-field full"><span>Комментарий</span><textarea rows={2} value={form.comment} onChange={(e) => set("comment", e.target.value)} placeholder="Назначение платежа…" /></div>
      </div>
      <div className="sc-modal-foot">
        <button className="sc-btn ghost" onClick={onClose}>Отмена</button>
        <button className="sc-btn" onClick={() => onSave(form)}>Сохранить</button>
      </div>
    </Modal>
  );
}

/* ================================ VAULT ================================ */
function VaultView({ vault, upVault }) {
  const [tab, setTab] = useState("passwords");
  const TABS = [
    { id: "passwords", label: "Пароли", icon: Shield },
    { id: "notes", label: "Заметки", icon: StickyNote },
    { id: "tasks", label: "Задачи", icon: CheckSquare },
    { id: "docs", label: "Документы", icon: FileText },
  ];
  return (
    <div className="sc-view">
      <ViewHead title="Сейф" sub="Пароли, заметки, задачи и документы — всё в одном месте" />
      <div className="sc-chips" style={{ marginBottom: 18 }}>
        {TABS.map((t) => { const I = t.icon; return (
          <button key={t.id} className={"sc-chip wic" + (tab === t.id ? " on" : "")} onClick={() => setTab(t.id)}><I size={14} />{t.label}</button>
        ); })}
      </div>
      {tab === "passwords" && <Passwords vault={vault} upVault={upVault} />}
      {tab === "notes" && <Notes vault={vault} upVault={upVault} />}
      {tab === "tasks" && <Tasks vault={vault} upVault={upVault} />}
      {tab === "docs" && <Docs vault={vault} upVault={upVault} />}
    </div>
  );
}
function Passwords({ vault, upVault }) {
  const [show, setShow] = useState({});
  const add = () => upVault({ ...vault, passwords: [...vault.passwords, { id: uid(), title: "", login: "", password: "", url: "", note: "" }] });
  const set = (id, k, v) => upVault({ ...vault, passwords: vault.passwords.map((p) => p.id === id ? { ...p, [k]: v } : p) });
  const del = (id) => upVault({ ...vault, passwords: vault.passwords.filter((p) => p.id !== id) });
  return (
    <div>
      <div className="sc-vault-add"><button className="sc-btn small" onClick={add}><Plus size={15} /> Новая запись</button></div>
      <div className="sc-cards-grid">
        {vault.passwords.map((p) => (
          <div key={p.id} className="sc-card pw">
            <div className="sc-card-head"><input className="sc-bare strong" placeholder="Название (сервис)" value={p.title} onChange={(e) => set(p.id, "title", e.target.value)} />
              <button className="sc-icon-btn danger" onClick={() => del(p.id)}><Trash2 size={15} /></button></div>
            <div className="sc-pw-row"><span>Логин</span><input className="sc-bare" value={p.login} onChange={(e) => set(p.id, "login", e.target.value)} />
              <button className="sc-icon-btn" onClick={() => navigator.clipboard?.writeText(p.login)}><Copy size={13} /></button></div>
            <div className="sc-pw-row"><span>Пароль</span><input className="sc-bare" type={show[p.id] ? "text" : "password"} value={p.password} onChange={(e) => set(p.id, "password", e.target.value)} />
              <button className="sc-icon-btn" onClick={() => setShow((s) => ({ ...s, [p.id]: !s[p.id] }))}>{show[p.id] ? <EyeOff size={13} /> : <Eye size={13} />}</button>
              <button className="sc-icon-btn" onClick={() => navigator.clipboard?.writeText(p.password)}><Copy size={13} /></button></div>
            <div className="sc-pw-row"><span>URL</span><input className="sc-bare" value={p.url} onChange={(e) => set(p.id, "url", e.target.value)} /></div>
            <input className="sc-bare note" placeholder="Заметка…" value={p.note} onChange={(e) => set(p.id, "note", e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  );
}
function Notes({ vault, upVault }) {
  const add = () => upVault({ ...vault, notes: [{ id: uid(), title: "", body: "", createdAt: todayISO() }, ...vault.notes] });
  const set = (id, k, v) => upVault({ ...vault, notes: vault.notes.map((n) => n.id === id ? { ...n, [k]: v } : n) });
  const del = (id) => upVault({ ...vault, notes: vault.notes.filter((n) => n.id !== id) });
  return (
    <div>
      <div className="sc-vault-add"><button className="sc-btn small" onClick={add}><Plus size={15} /> Новая заметка</button></div>
      <div className="sc-cards-grid">
        {vault.notes.map((n) => (
          <div key={n.id} className="sc-card note">
            <div className="sc-card-head"><input className="sc-bare strong" placeholder="Заголовок" value={n.title} onChange={(e) => set(n.id, "title", e.target.value)} />
              <button className="sc-icon-btn danger" onClick={() => del(n.id)}><Trash2 size={15} /></button></div>
            <textarea className="sc-bare" rows={5} placeholder="Текст заметки…" value={n.body} onChange={(e) => set(n.id, "body", e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  );
}
function Tasks({ vault, upVault }) {
  const [title, setTitle] = useState(""); const [due, setDue] = useState(todayISO());
  const add = () => { if (!title.trim()) return; upVault({ ...vault, tasks: [...vault.tasks, { id: uid(), title, done: false, due }] }); setTitle(""); };
  const toggle = (id) => upVault({ ...vault, tasks: vault.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t) });
  const del = (id) => upVault({ ...vault, tasks: vault.tasks.filter((t) => t.id !== id) });
  const open = vault.tasks.filter((t) => !t.done), done = vault.tasks.filter((t) => t.done);
  return (
    <div className="sc-card">
      <div className="sc-task-add">
        <input placeholder="Новая задача…" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <button className="sc-btn small" onClick={add}><Plus size={15} /> Добавить</button>
      </div>
      <ul className="sc-tasklist big">
        {open.map((t) => (
          <li key={t.id}>
            <button className="sc-check" onClick={() => toggle(t.id)}><Check size={13} /></button>
            <span>{t.title}</span>
            <em className="sc-muted-s">{new Date(t.due).toLocaleDateString("ru-RU")}</em>
            <button className="sc-icon-btn danger" onClick={() => del(t.id)}><Trash2 size={14} /></button>
          </li>
        ))}
        {open.length === 0 && <div className="sc-empty">Открытых задач нет.</div>}
        {done.length > 0 && <li className="sc-task-sep">Выполнено</li>}
        {done.map((t) => (
          <li key={t.id} className="done">
            <button className="sc-check on" onClick={() => toggle(t.id)}><Check size={13} /></button>
            <span>{t.title}</span>
            <button className="sc-icon-btn danger" onClick={() => del(t.id)}><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}
function Docs({ vault, upVault }) {
  const add = () => upVault({ ...vault, docs: [...vault.docs, { id: uid(), title: "", link: "", note: "" }] });
  const set = (id, k, v) => upVault({ ...vault, docs: vault.docs.map((d) => d.id === id ? { ...d, [k]: v } : d) });
  const del = (id) => upVault({ ...vault, docs: vault.docs.filter((d) => d.id !== id) });
  return (
    <div>
      <div className="sc-vault-add"><button className="sc-btn small" onClick={add}><Plus size={15} /> Добавить документ</button></div>
      <div className="sc-cards-grid">
        {vault.docs.map((d) => (
          <div key={d.id} className="sc-card doc">
            <div className="sc-card-head"><div className="sc-doc-ttl"><FileText size={16} /><input className="sc-bare strong" placeholder="Название документа" value={d.title} onChange={(e) => set(d.id, "title", e.target.value)} /></div>
              <button className="sc-icon-btn danger" onClick={() => del(d.id)}><Trash2 size={15} /></button></div>
            <div className="sc-pw-row"><span><Link2 size={13} /></span><input className="sc-bare" placeholder="Ссылка / путь" value={d.link} onChange={(e) => set(d.id, "link", e.target.value)} /></div>
            <input className="sc-bare note" placeholder="Описание…" value={d.note} onChange={(e) => set(d.id, "note", e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================ ТАБЛИЦЫ (Excel/CSV) ================================ */
function colName(i) {
  let s = "";
  i = i + 1;
  while (i > 0) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); }
  return s;
}
function fmtSize(b) {
  if (!b) return "—";
  if (b < 1024) return b + " Б";
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + " КБ";
  return (b / 1024 / 1024).toFixed(1) + " МБ";
}
function Spreadsheets() {
  const [list, setList] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [doc, setDoc] = useState(null);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);

  const refresh = async () => setList(await api.sheets.list());
  useEffect(() => { refresh(); }, []);

  const importFile = async () => {
    setBusy(true);
    try {
      const res = await api.sheets.import();
      if (res) await refresh();
    } finally { setBusy(false); }
  };

  const open = async (id) => {
    setBusy(true);
    try {
      const d = await api.sheets.open(id);
      setDoc(d); setActive(0); setOpenId(id);
    } finally { setBusy(false); }
  };

  const remove = async (id) => {
    await api.sheets.remove(id);
    if (openId === id) { setOpenId(null); setDoc(null); }
    await refresh();
  };

  const back = () => { setOpenId(null); setDoc(null); };

  // ---- режим просмотра конкретной таблицы ----
  if (openId && doc) {
    const sheet = doc.sheets[active] || { data: [], cols: 0, rows: 0 };
    return (
      <div className="sc-view">
        <div className="sc-sheet-bar">
          <button className="sc-btn ghost small" onClick={back}><ArrowLeft size={15} /> К списку</button>
          <h1 className="sc-vtitle" style={{ fontSize: 22 }}>{doc.name}</h1>
        </div>

        {doc.sheets.length > 1 && (
          <div className="sc-chips small" style={{ marginBottom: 12 }}>
            {doc.sheets.map((s, i) => (
              <button key={i} className={"sc-chip" + (active === i ? " on" : "")} onClick={() => setActive(i)}>{s.name}</button>
            ))}
          </div>
        )}

        {sheet.data.length === 0 ? (
          <div className="sc-empty">Лист пустой.</div>
        ) : (
          <div className="sc-sheet-wrap">
            <table className="sc-sheet">
              <thead>
                <tr>
                  <th className="sc-sheet-corner"></th>
                  {Array.from({ length: sheet.cols }).map((_, c) => <th key={c} className="sc-sheet-colh">{colName(c)}</th>)}
                </tr>
              </thead>
              <tbody>
                {sheet.data.map((row, r) => (
                  <tr key={r}>
                    <td className="sc-sheet-rowh">{r + 1}</td>
                    {Array.from({ length: sheet.cols }).map((_, c) => <td key={c}>{row[c] || ""}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {sheet.truncated && <div className="sc-muted-s" style={{ marginTop: 10 }}>Показана часть таблицы (очень большой файл).</div>}
      </div>
    );
  }

  // ---- список импортированных таблиц ----
  return (
    <div className="sc-view">
      <div className="sc-vhead">
        <div><h1 className="sc-vtitle">Таблицы<i className="sc-red-dot small" /></h1><p className="sc-muted">Excel и CSV-файлы хранятся внутри CRM</p></div>
        <button className="sc-btn" onClick={importFile} disabled={busy}><Upload size={16} /> {busy ? "Загрузка…" : "Импорт таблицы"}</button>
      </div>

      {list.length === 0 ? (
        <div className="sc-card"><div className="sc-empty">Пока нет таблиц. Нажмите «Импорт таблицы» и выберите файл .xlsx или .csv — он сохранится здесь.</div></div>
      ) : (
        <div className="sc-cards-grid">
          {list.map((s) => (
            <div key={s.id} className="sc-card sheet-item" onClick={() => open(s.id)}>
              <div className="sc-sheet-ic"><FileSpreadsheet size={22} /></div>
              <div className="sc-sheet-meta">
                <strong>{s.name}</strong>
                <span className="sc-muted-s">{fmtSize(s.size)} · {new Date(s.importedAt).toLocaleDateString("ru-RU")}</span>
              </div>
              <button className="sc-icon-btn danger" onClick={(e) => { e.stopPropagation(); remove(s.id); }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- общая шапка раздела ----------------------------- */
function ViewHead({ title, sub, onAdd, addLabel }) {
  return (
    <div className="sc-vhead">
      <div><h1 className="sc-vtitle">{title}<i className="sc-red-dot small" /></h1><p className="sc-muted">{sub}</p></div>
      {onAdd && <button className="sc-btn" onClick={onAdd}><Plus size={16} /> {addLabel}</button>}
    </div>
  );
}
