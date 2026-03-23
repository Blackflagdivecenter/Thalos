import { create } from 'zustand';
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';

// ── Constants ─────────────────────────────────────────────────────────────────

export const RC_API_KEY = 'test_lsgfUFWWWbiKEuFsNCEVqquGzmJ';

// The entitlement identifier you'll create in the RevenueCat dashboard
export const ENTITLEMENT_ID = 'premium';

// Offering identifier (use 'default' unless you name it otherwise)
export const OFFERING_ID = 'default';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubscriptionState {
  initialized: boolean;
  isActive: boolean;          // true if user has an active subscription
  isTrialActive: boolean;     // true if currently in free trial
  customerInfo: CustomerInfo | null;
  packages: PurchasesPackage[];
  loading: boolean;
  purchaseError: string | null;

  initialize: (userId: string | null) => Promise<void>;
  checkSubscription: () => Promise<void>;
  fetchPackages: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  initialized: false,
  isActive: false,
  isTrialActive: false,
  customerInfo: null,
  packages: [],
  loading: false,
  purchaseError: null,

  initialize: async (userId) => {
    // Test keys crash release builds (RevenueCat native fatal).
    // Skip RC entirely in that case and unlock the app for demo purposes.
    if (!__DEV__ && RC_API_KEY.startsWith('test_')) {
      console.warn('[Subscription] Test key detected in release build — bypassing RC.');
      set({ initialized: true, isActive: true });
      return;
    }

    try {
      if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      Purchases.configure({ apiKey: RC_API_KEY, appUserID: userId ?? undefined });

      // Keep subscription state in sync with RevenueCat
      Purchases.addCustomerInfoUpdateListener((info) => {
        const entitlement = info.entitlements.active[ENTITLEMENT_ID];
        set({
          customerInfo: info,
          isActive: !!entitlement,
          isTrialActive: entitlement?.periodType === 'TRIAL',
        });
      });

      await get().checkSubscription();
      set({ initialized: true });
    } catch (e) {
      console.warn('[Subscription] init error:', e);
      set({ initialized: true }); // don't block app on RC init failure
    }
  },

  checkSubscription: async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      const entitlement = info.entitlements.active[ENTITLEMENT_ID];
      set({
        customerInfo: info,
        isActive: !!entitlement,
        isTrialActive: entitlement?.periodType === 'TRIAL',
      });
    } catch (e) {
      console.warn('[Subscription] checkSubscription error:', e);
    }
  },

  fetchPackages: async () => {
    try {
      set({ loading: true });
      const offerings = await Purchases.getOfferings();
      const offering = offerings.current ?? offerings.all[OFFERING_ID];
      set({ packages: offering?.availablePackages ?? [] });
    } catch (e) {
      console.warn('[Subscription] fetchPackages error:', e);
    } finally {
      set({ loading: false });
    }
  },

  purchasePackage: async (pkg) => {
    set({ loading: true, purchaseError: null });
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      set({
        customerInfo,
        isActive: !!entitlement,
        isTrialActive: entitlement?.periodType === 'TRIAL',
      });
      return !!entitlement;
    } catch (e: any) {
      if (!e.userCancelled) {
        set({ purchaseError: e.message ?? 'Purchase failed' });
      }
      return false;
    } finally {
      set({ loading: false });
    }
  },

  restorePurchases: async () => {
    set({ loading: true, purchaseError: null });
    try {
      const info = await Purchases.restorePurchases();
      const entitlement = info.entitlements.active[ENTITLEMENT_ID];
      set({
        customerInfo: info,
        isActive: !!entitlement,
        isTrialActive: entitlement?.periodType === 'TRIAL',
      });
      return !!entitlement;
    } catch (e: any) {
      set({ purchaseError: e.message ?? 'Restore failed' });
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
