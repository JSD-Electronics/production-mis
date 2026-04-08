"use client";

import { getAllMenus, getUseTypeByType } from "@/lib/api";

const PORTAL_ACCESS_CACHE_KEY = "portalAccessCache:v1";
const PORTAL_ACCESS_PERSIST_KEY = "portalAccessCache:persist:v1";
const PORTAL_ACCESS_CACHE_TTL_MS = 5 * 60 * 1000;
const PORTAL_ACCESS_STALE_MAX_MS = 24 * 60 * 60 * 1000;

export interface PortalMenuItem {
  label: string;
  route: string;
  children?: PortalMenuItem[];
  [key: string]: any;
}

export interface PortalAccessData {
  userType: string;
  normalizedUserType: string;
  permissions: Record<string, any>;
  menus: PortalMenuItem[];
  flatMenuItems: { label: string; route: string }[];
  fetchedAt: number;
}

let portalAccessPromise: Promise<PortalAccessData> | null = null;
let portalAccessMemoryCache: PortalAccessData | null = null;

const reportsMenu: PortalMenuItem = {
  icon: `<svg class="fill-current" width="18" height="19" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h12v2H3v-2z" fill="#ffffff"/></svg>`,
  label: "Reports",
  route: "#",
  children: [{ label: "NG Devices Report", route: "/reports/ng-devices" }],
};

export const normalizeUserType = (value: string) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

export const normalizeRoutePath = (route: any) => {
  const raw = String(route ?? "").trim();
  if (!raw) return raw;
  if (raw === "#") return "#";

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      return `${url.pathname}${url.search}${url.hash}` || "/";
    } catch {
      return raw;
    }
  }

  if (!raw.startsWith("/") && !raw.startsWith("?")) {
    return `/${raw}`;
  }

  return raw;
};

const normalizeMenuTree = (node: any): PortalMenuItem => {
  const next: PortalMenuItem = { ...(node || {}) };
  next.route = normalizeRoutePath(next.route);
  if (Array.isArray(next.children)) {
    next.children = next.children.map(normalizeMenuTree);
  }
  return next;
};

const withReportsMenu = (menus: PortalMenuItem[]) => {
  const existingMenus = Array.isArray(menus) ? [...menus] : [];
  const reportsIndex = existingMenus.findIndex(
    (menu) => String(menu?.label || "").toLowerCase() === "reports",
  );

  if (reportsIndex === -1) {
    existingMenus.push(reportsMenu);
    return existingMenus;
  }

  const reports = existingMenus[reportsIndex] || reportsMenu;
  const children = Array.isArray(reports.children) ? [...reports.children] : [];
  const hasNgReport = children.some(
    (child) => normalizeRoutePath(child?.route) === "/reports/ng-devices",
  );

  if (!hasNgReport) {
    children.push({ label: "NG Devices Report", route: "/reports/ng-devices" });
  }

  existingMenus[reportsIndex] = {
    ...reports,
    children,
  };

  return existingMenus;
};

const sortMenus = (menus: PortalMenuItem[]) =>
  [...menus].sort((a, b) => {
    const aHasChildren = Array.isArray(a?.children) && a.children.length > 0;
    const bHasChildren = Array.isArray(b?.children) && b.children.length > 0;
    if (aHasChildren === bHasChildren) return 0;
    return aHasChildren ? 1 : -1;
  });

const flattenRoutableMenus = (menus: PortalMenuItem[]) => {
  const flat: { label: string; route: string }[] = [];

  const walk = (items: PortalMenuItem[]) => {
    items.forEach((item) => {
      if (Array.isArray(item?.children) && item.children.length > 0) {
        walk(item.children);
        return;
      }

      const route = normalizeRoutePath(item?.route);
      if (route && route !== "#") {
        flat.push({ label: item.label, route });
      }
    });
  };

  walk(Array.isArray(menus) ? menus : []);
  return flat;
};

const isPortalAccessFresh = (cache?: PortalAccessData | null) =>
  Boolean(
    cache &&
      typeof cache?.fetchedAt === "number" &&
      Date.now() - cache.fetchedAt < PORTAL_ACCESS_CACHE_TTL_MS,
  );

const isPortalAccessNotTooOld = (cache?: PortalAccessData | null) =>
  Boolean(
    cache &&
      typeof cache?.fetchedAt === "number" &&
      Date.now() - cache.fetchedAt < PORTAL_ACCESS_STALE_MAX_MS,
  );

const isPortalAccessForUser = (
  cache: PortalAccessData | null | undefined,
  normalizedUserType: string,
) => cache?.normalizedUserType === normalizedUserType;

const readCachedPortalAccess = (
  normalizedUserType: string,
  options?: { allowStale?: boolean },
): PortalAccessData | null => {
  if (typeof window === "undefined") return null;
  const allowStale = options?.allowStale === true;

  const acceptCache = (cache: PortalAccessData | null | undefined) => {
    if (!cache || !isPortalAccessForUser(cache, normalizedUserType)) return null;
    if (isPortalAccessFresh(cache)) return cache;
    if (allowStale && isPortalAccessNotTooOld(cache)) return cache;
    return null;
  };

  const memoryCache = acceptCache(portalAccessMemoryCache);
  if (memoryCache) return memoryCache;

  try {
    const raw = window.sessionStorage.getItem(PORTAL_ACCESS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PortalAccessData;
      const accepted = acceptCache(parsed);
      if (accepted) {
        portalAccessMemoryCache = accepted;
        return accepted;
      }
    }
  } catch {
    // Ignore session storage parse errors and continue with localStorage.
  }

  try {
    const raw = window.localStorage.getItem(PORTAL_ACCESS_PERSIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PortalAccessData;
      const accepted = acceptCache(parsed);
      if (accepted) {
        portalAccessMemoryCache = accepted;
        try {
          window.sessionStorage.setItem(PORTAL_ACCESS_CACHE_KEY, JSON.stringify(accepted));
        } catch {
          // Best-effort only.
        }
        return accepted;
      }
    }
  } catch {
    // Ignore local storage parse errors.
  }

  return null;
};

const writeCachedPortalAccess = (data: PortalAccessData) => {
  if (typeof window === "undefined") return;
  portalAccessMemoryCache = data;

  try {
    window.sessionStorage.setItem(PORTAL_ACCESS_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage failures and continue with in-memory caching.
  }

  try {
    window.localStorage.setItem(PORTAL_ACCESS_PERSIST_KEY, JSON.stringify(data));
  } catch {
    // Ignore persistent storage failures.
  }
};

export const readStoredUserDetails = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem("userDetails");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getPortalAccessData = async (
  rawUserType?: string,
  options?: {
    forceRefresh?: boolean;
    allowStale?: boolean;
    backgroundRefresh?: boolean;
  },
): Promise<PortalAccessData> => {
  const userDetails = readStoredUserDetails();
  const userType = rawUserType || userDetails?.userType || "";
  const normalizedUserType = normalizeUserType(userType);
  const forceRefresh = options?.forceRefresh === true;
  const allowStale = options?.allowStale === true;

  if (!forceRefresh) {
    const cached = readCachedPortalAccess(normalizedUserType, { allowStale });
    if (cached) {
      if (options?.backgroundRefresh) {
        void getPortalAccessData(rawUserType, { forceRefresh: true }).catch(() => {
          // Background refresh failure should never block UI.
        });
      }
      return cached;
    }

    if (portalAccessPromise) {
      return portalAccessPromise;
    }
  }

  if (portalAccessPromise) {
    return portalAccessPromise;
  }

  portalAccessPromise = Promise.all([getUseTypeByType(), getAllMenus()])
    .then(([userTypeResult, menuResult]) => {
      const permissions = userTypeResult?.userType?.[0]?.roles || {};
      const fetchedMenus = Array.isArray(menuResult?.getMenu?.[0]?.menus)
        ? menuResult.getMenu[0].menus
        : [];

      const menus = sortMenus(withReportsMenu(fetchedMenus).map(normalizeMenuTree));

      const data: PortalAccessData = {
        userType,
        normalizedUserType,
        permissions,
        menus,
        flatMenuItems: flattenRoutableMenus(menus),
        fetchedAt: Date.now(),
      };

      writeCachedPortalAccess(data);
      return data;
    })
    .finally(() => {
      portalAccessPromise = null;
    });

  return portalAccessPromise;
};

export const preloadPortalAccess = (rawUserType?: string) => {
  void getPortalAccessData(rawUserType, {
    allowStale: true,
    backgroundRefresh: true,
  }).catch(() => {
    // Best-effort warmup.
  });
};
