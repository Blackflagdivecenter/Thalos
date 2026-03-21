import { create } from 'zustand';
import { DiveService } from '@/src/services/DiveService';
import {
  DiveWithVersion,
  DiveStats,
  CreateDiveInput,
  EditDiveInput,
} from '@/src/models';

const service = new DiveService();

interface DiveState {
  dives: DiveWithVersion[];
  stats: DiveStats;
  isLoading: boolean;
  error: string | null;

  loadDives: () => void;
  createDive: (input: CreateDiveInput) => DiveWithVersion;
  editDive: (id: string, input: EditDiveInput) => DiveWithVersion;
  deleteDive: (id: string) => void;
}

export const useDiveStore = create<DiveState>((set, get) => ({
  dives: [],
  stats: { totalDives: 0, totalBottomTimeMinutes: 0, maxDepthMeters: null },
  isLoading: false,
  error: null,

  loadDives: () => {
    set({ isLoading: true, error: null });
    try {
      const dives = service.getAllDives();
      const stats = service.getStats();
      set({ dives, stats, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  createDive: (input) => {
    const dive = service.createDive(input);
    get().loadDives();
    return dive;
  },

  editDive: (id, input) => {
    const dive = service.editDive(id, input);
    get().loadDives();
    return dive;
  },

  deleteDive: (id) => {
    service.softDeleteDive(id);
    get().loadDives();
  },
}));
