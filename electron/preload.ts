import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("crm", {
  leads: {
    list: () => ipcRenderer.invoke("leads:list"),
    save: (lead: any) => ipcRenderer.invoke("leads:save", lead),
    remove: (id: string) => ipcRenderer.invoke("leads:remove", id),
  },
  notes: {
    add: (leadId: string, text: string) => ipcRenderer.invoke("notes:add", leadId, text),
    remove: (id: string) => ipcRenderer.invoke("notes:remove", id),
  },
  tx: {
    list: () => ipcRenderer.invoke("tx:list"),
    save: (t: any) => ipcRenderer.invoke("tx:save", t),
    remove: (id: string) => ipcRenderer.invoke("tx:remove", id),
  },
  vault: {
    all: () => ipcRenderer.invoke("vault:all"),
    savePassword: (p: any) => ipcRenderer.invoke("vault:savePassword", p),
    removePassword: (id: string) => ipcRenderer.invoke("vault:removePassword", id),
    saveNote: (n: any) => ipcRenderer.invoke("vault:saveNote", n),
    removeNote: (id: string) => ipcRenderer.invoke("vault:removeNote", id),
    saveTask: (t: any) => ipcRenderer.invoke("vault:saveTask", t),
    removeTask: (id: string) => ipcRenderer.invoke("vault:removeTask", id),
    saveDoc: (d: any) => ipcRenderer.invoke("vault:saveDoc", d),
    removeDoc: (id: string) => ipcRenderer.invoke("vault:removeDoc", id),
  },
  backup: {
    export: () => ipcRenderer.invoke("backup:export"),
    reveal: () => ipcRenderer.invoke("backup:reveal"),
  },
  sheets: {
    list: () => ipcRenderer.invoke("sheets:list"),
    import: () => ipcRenderer.invoke("sheets:import"),
    open: (id: string) => ipcRenderer.invoke("sheets:open", id),
    remove: (id: string) => ipcRenderer.invoke("sheets:remove", id),
  },
});
