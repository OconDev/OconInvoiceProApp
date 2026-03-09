
import { Document, Client, Workspace, BusinessSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const KEYS = {
  DOCUMENTS: 'ocon_docs',
  CLIENTS: 'ocon_clients',
  WORKSPACES: 'ocon_workspaces',
  SETTINGS: 'ocon_settings',
};

export const storage = {
  getDocs: (): Document[] => JSON.parse(localStorage.getItem(KEYS.DOCUMENTS) || '[]'),
  saveDocs: (docs: Document[]) => localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs)),
  
  getClients: (): Client[] => JSON.parse(localStorage.getItem(KEYS.CLIENTS) || '[]'),
  saveClients: (clients: Client[]) => localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients)),
  
  getWorkspaces: (): Workspace[] => JSON.parse(localStorage.getItem(KEYS.WORKSPACES) || '[]'),
  saveWorkspaces: (ws: Workspace[]) => localStorage.setItem(KEYS.WORKSPACES, JSON.stringify(ws)),
  
  getSettings: (): BusinessSettings => {
    const s = localStorage.getItem(KEYS.SETTINGS);
    return s ? JSON.parse(s) : DEFAULT_SETTINGS;
  },
  saveSettings: (s: BusinessSettings) => localStorage.setItem(KEYS.SETTINGS, JSON.stringify(s)),
};
