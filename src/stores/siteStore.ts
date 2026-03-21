import { create } from 'zustand';
import { SiteService } from '@/src/services/SiteService';
import { Site, EAP, CreateSiteInput } from '@/src/models';

const service = new SiteService();

interface SiteState {
  sites: Site[];
  isLoading: boolean;
  error: string | null;

  loadSites: () => void;
  createSite: (input: CreateSiteInput) => Site;
  updateSite: (id: string, input: Partial<CreateSiteInput>) => Site;
  deleteSite: (id: string) => void;
  getEAP: (siteId: string) => EAP | null;
  updateEAP: (siteId: string, fields: Partial<Omit<EAP, 'id' | 'siteId' | 'createdAt'>>) => void;
}

export const useSiteStore = create<SiteState>((set, get) => ({
  sites: [],
  isLoading: false,
  error: null,

  loadSites: () => {
    set({ isLoading: true, error: null });
    try {
      const sites = service.getAllSites();
      set({ sites, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  createSite: (input) => {
    const site = service.createSite(input);
    get().loadSites();
    return site;
  },

  updateSite: (id, input) => {
    const site = service.updateSite(id, input);
    get().loadSites();
    return site;
  },

  deleteSite: (id) => {
    service.deleteSite(id);
    get().loadSites();
  },

  getEAP: (siteId) => service.getEAP(siteId),

  updateEAP: (siteId, fields) => {
    service.updateEAP(siteId, fields);
  },
}));
