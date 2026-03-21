import { getDb } from '@/src/db/client';
import { DashboardConfig } from '@/src/models';
import { nowISO } from '@/src/utils/uuid';

export const DEFAULT_WIDGET_ORDER = [
  'recentDives',
  'stats',
  'gasConsumption',
  'quickActions',
  'discover',
  'emergency',
  'sites',
];

export class DashboardRepository {
  getConfig(): DashboardConfig {
    const db = getDb();
    const row = db.getFirstSync<{
      widget_order: string;
      hidden_widgets: string;
      updated_at: string;
    }>('SELECT widget_order, hidden_widgets, updated_at FROM dashboard_config WHERE id = 1');

    if (!row) {
      return { widgetOrder: DEFAULT_WIDGET_ORDER, hiddenWidgets: [], updatedAt: nowISO() };
    }

    let order: string[] = [];
    try { order = JSON.parse(row.widget_order) as string[]; } catch { order = DEFAULT_WIDGET_ORDER; }

    // Ensure all default widgets are present (handle schema additions)
    const merged = [
      ...order.filter(id => DEFAULT_WIDGET_ORDER.includes(id)),
      ...DEFAULT_WIDGET_ORDER.filter(id => !order.includes(id)),
    ];

    return {
      widgetOrder: merged,
      hiddenWidgets: JSON.parse(row.hidden_widgets) as string[],
      updatedAt: row.updated_at,
    };
  }

  saveConfig(order: string[], hidden: string[]): void {
    const db = getDb();
    const now = nowISO();
    db.runSync(
      `INSERT INTO dashboard_config (id, widget_order, hidden_widgets, updated_at)
       VALUES (1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         widget_order    = excluded.widget_order,
         hidden_widgets  = excluded.hidden_widgets,
         updated_at      = excluded.updated_at`,
      [JSON.stringify(order), JSON.stringify(hidden), now]
    );
  }

  /** Legacy compat: update only hidden list without touching order */
  saveHiddenWidgets(hidden: string[]): void {
    const config = this.getConfig();
    this.saveConfig(config.widgetOrder, hidden);
  }
}
