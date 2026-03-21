import { Appearance } from 'react-native';
import { create } from 'zustand';
import { getDb } from '@/src/db/client';
import { nowISO } from '@/src/utils/uuid';

type UnitSystem = 'metric' | 'imperial';
type ThemeMode  = 'light' | 'dark' | 'system';

interface UIState {
  unitSystem: UnitSystem;
  themeMode:  ThemeMode;
  setUnitSystem: (system: UnitSystem) => void;
  loadUnitSystem: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  loadThemeMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  unitSystem: 'metric',
  themeMode:  'system',

  setUnitSystem: (unitSystem) => {
    set({ unitSystem });
    try {
      getDb().runSync(
        `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
        ['unit_system', unitSystem, nowISO()],
      );
    } catch { /* DB may not be ready */ }
  },

  loadUnitSystem: () => {
    try {
      const row = getDb().getFirstSync<{ value: string }>(
        `SELECT value FROM app_settings WHERE key = 'unit_system'`,
      );
      if (row?.value === 'metric' || row?.value === 'imperial') {
        set({ unitSystem: row.value });
      }
    } catch { /* ignore */ }
  },

  setThemeMode: (themeMode) => {
    set({ themeMode });
    // Apply at OS level — this drives DynamicColorIOS in all StyleSheet.create calls
    try {
      Appearance.setColorScheme(themeMode === 'system' ? 'unspecified' : themeMode);
    } catch { /* setColorScheme may not be available on all platforms */ }
    try {
      getDb().runSync(
        `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
        ['theme_mode', themeMode, nowISO()],
      );
    } catch { /* DB may not be ready */ }
  },

  loadThemeMode: () => {
    try {
      const row = getDb().getFirstSync<{ value: string }>(
        `SELECT value FROM app_settings WHERE key = 'theme_mode'`,
      );
      if (row?.value === 'light' || row?.value === 'dark' || row?.value === 'system') {
        const mode = row.value as ThemeMode;
        set({ themeMode: mode });
        try { Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode); } catch { /* ok */ }
      }
    } catch { /* ignore */ }
  },
}));
