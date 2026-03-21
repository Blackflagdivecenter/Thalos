import { create } from 'zustand';
import { GearRepository } from '@/src/repositories/GearRepository';
import type {
  GearItem, GearSet, GearSetWithItems, ServiceRecord,
  CreateGearItemInput, UpdateGearItemInput,
  CreateGearSetInput, UpdateGearSetInput,
  CreateServiceRecordInput,
} from '@/src/models';

interface GearState {
  items: GearItem[];
  sets:  GearSetWithItems[];

  loadGear: () => void;

  // Items
  createItem:  (input: CreateGearItemInput) => GearItem;
  updateItem:  (id: string, input: UpdateGearItemInput) => void;
  deleteItem:  (id: string) => void;

  // Sets
  createSet:  (input: CreateGearSetInput) => GearSet;
  updateSet:  (id: string, input: UpdateGearSetInput) => void;
  deleteSet:  (id: string) => void;

  // Set membership
  addItemToSet:      (setId: string, itemId: string) => void;
  removeItemFromSet: (setId: string, itemId: string) => void;

  // Dive count (called after dive save)
  logDivesOnSet: (setId: string) => void;

  // Service
  addServiceRecord:  (input: CreateServiceRecordInput) => ServiceRecord;
  getServiceHistory: (itemId: string) => ServiceRecord[];
}

export const useGearStore = create<GearState>((set, get) => ({
  items: [],
  sets:  [],

  loadGear: () => {
    const items = GearRepository.listItems();
    const sets  = GearRepository.listSetsWithItems();
    set({ items, sets });
  },

  createItem: (input) => {
    const item = GearRepository.createItem(input);
    set(s => ({ items: [...s.items, item] }));
    return item;
  },

  updateItem: (id, input) => {
    GearRepository.updateItem(id, input);
    // Reload the affected item
    const updated = GearRepository.getItem(id);
    if (updated) {
      set(s => ({ items: s.items.map(i => i.id === id ? updated : i) }));
    }
  },

  deleteItem: (id) => {
    GearRepository.deleteItem(id);
    set(s => ({
      items: s.items.filter(i => i.id !== id),
      // Also remove from any set's items array in memory
      sets:  s.sets.map(gs => ({
        ...gs,
        items: gs.items.filter(i => i.id !== id),
      })),
    }));
  },

  createSet: (input) => {
    const gs = GearRepository.createSet(input);
    // If this is new default, clear old default flag in memory
    if (gs.isDefault) {
      set(s => ({
        sets: [
          ...s.sets.map(existing =>
            existing.divingType === gs.divingType && existing.id !== gs.id
              ? { ...existing, isDefault: false }
              : existing
          ),
          { ...gs, items: [] } as GearSetWithItems,
        ],
      }));
    } else {
      set(s => ({ sets: [...s.sets, { ...gs, items: [] } as GearSetWithItems] }));
    }
    return gs;
  },

  updateSet: (id, input) => {
    GearRepository.updateSet(id, input);
    const updated = GearRepository.getSetWithItems(id);
    if (updated) {
      if (updated.isDefault) {
        set(s => ({
          sets: s.sets.map(gs => {
            if (gs.id === id) return updated;
            if (gs.divingType === updated.divingType) return { ...gs, isDefault: false };
            return gs;
          }),
        }));
      } else {
        set(s => ({ sets: s.sets.map(gs => gs.id === id ? updated : gs) }));
      }
    }
  },

  deleteSet: (id) => {
    GearRepository.deleteSet(id);
    set(s => ({ sets: s.sets.filter(gs => gs.id !== id) }));
  },

  addItemToSet: (setId, itemId) => {
    GearRepository.addItemToSet(setId, itemId);
    const updated = GearRepository.getSetWithItems(setId);
    if (updated) {
      set(s => ({ sets: s.sets.map(gs => gs.id === setId ? updated : gs) }));
    }
  },

  removeItemFromSet: (setId, itemId) => {
    GearRepository.removeItemFromSet(setId, itemId);
    set(s => ({
      sets: s.sets.map(gs =>
        gs.id === setId
          ? { ...gs, items: gs.items.filter(i => i.id !== itemId) }
          : gs
      ),
    }));
  },

  logDivesOnSet: (setId) => {
    GearRepository.logDivesOnSet(setId);
    // Reload full state so dive counts are correct everywhere
    get().loadGear();
  },

  addServiceRecord: (input) => {
    const record = GearRepository.addServiceRecord(input);
    // Refresh the affected item in state
    const updated = GearRepository.getItem(input.gearItemId);
    if (updated) {
      set(s => ({
        items: s.items.map(i => i.id === input.gearItemId ? updated : i),
        sets:  s.sets.map(gs => ({
          ...gs,
          items: gs.items.map(i => i.id === input.gearItemId ? updated : i),
        })),
      }));
    }
    return record;
  },

  getServiceHistory: (itemId) => {
    return GearRepository.getServiceHistory(itemId);
  },
}));
