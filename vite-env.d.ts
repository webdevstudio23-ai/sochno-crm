/// <reference types="vite/client" />

// raw-импорт SQL-схемы в главном процессе
declare module "*.sql?raw" {
  const content: string;
  export default content;
}

// API, проброшенное из preload через contextBridge
interface Window {
  crm: {
    leads: {
      list(): Promise<any[]>;
      save(lead: any): Promise<any>;
      remove(id: string): Promise<void>;
    };
    notes: {
      add(leadId: string, text: string): Promise<any>;
      remove(id: string): Promise<void>;
    };
    tx: {
      list(): Promise<any[]>;
      save(t: any): Promise<any>;
      remove(id: string): Promise<void>;
    };
    vault: {
      all(): Promise<{ passwords: any[]; notes: any[]; tasks: any[]; docs: any[] }>;
      savePassword(p: any): Promise<void>;
      removePassword(id: string): Promise<void>;
      saveNote(n: any): Promise<void>;
      removeNote(id: string): Promise<void>;
      saveTask(t: any): Promise<void>;
      removeTask(id: string): Promise<void>;
      saveDoc(d: any): Promise<void>;
      removeDoc(id: string): Promise<void>;
    };
    backup: {
      export(): Promise<string>;
      reveal(): Promise<void>;
    };
  };
}
