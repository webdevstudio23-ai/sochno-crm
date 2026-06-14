/**
 * Тонкая типизированная обёртка над window.crm (IPC к main-процессу).
 *
 * Прототип работает с целыми коллекциями (upLeads/upTx/upVault получают весь
 * массив/объект). Чтобы не переписывать компоненты, persist-функции
 * сравнивают предыдущее и новое состояние и дергают точечные методы
 * window.crm.*.save / *.remove. Так весь доступ к данным остаётся за одним
 * интерфейсом — для будущей веб-версии достаточно подменить реализацию.
 */

const crm = window.crm;

type Id = string;

export const api = {
  leads: {
    list: () => crm.leads.list(),
    save: (lead: any) => crm.leads.save(lead),
    remove: (id: Id) => crm.leads.remove(id),
    async persist(prev: any[], next: any[]) {
      for (const l of next) await crm.leads.save(l);
      for (const l of prev) if (!next.some((n) => n.id === l.id)) await crm.leads.remove(l.id);
    },
  },

  tx: {
    list: () => crm.tx.list(),
    save: (t: any) => crm.tx.save(t),
    remove: (id: Id) => crm.tx.remove(id),
    async persist(prev: any[], next: any[]) {
      for (const t of next) await crm.tx.save(t);
      for (const t of prev) if (!next.some((n) => n.id === t.id)) await crm.tx.remove(t.id);
    },
  },

  vault: {
    all: () => crm.vault.all(),
    async persist(prev: any, next: any) {
      const kinds: Array<[string, "savePassword" | "saveNote" | "saveTask" | "saveDoc", "removePassword" | "removeNote" | "removeTask" | "removeDoc"]> = [
        ["passwords", "savePassword", "removePassword"],
        ["notes", "saveNote", "removeNote"],
        ["tasks", "saveTask", "removeTask"],
        ["docs", "saveDoc", "removeDoc"],
      ];
      for (const [key, save, remove] of kinds) {
        const nextArr: any[] = next[key] || [];
        const prevArr: any[] = prev[key] || [];
        for (const item of nextArr) await (crm.vault as any)[save](item);
        for (const item of prevArr) if (!nextArr.some((n) => n.id === item.id)) await (crm.vault as any)[remove](item.id);
      }
    },
  },

  backup: {
    export: () => crm.backup.export(),
    reveal: () => crm.backup.reveal(),
  },

  sheets: {
    list: () => crm.sheets.list(),
    import: () => crm.sheets.import(),
    open: (id: Id) => crm.sheets.open(id),
    remove: (id: Id) => crm.sheets.remove(id),
  },
};
