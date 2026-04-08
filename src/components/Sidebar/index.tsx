import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SidebarItem from "@/components/Sidebar/SidebarItem";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";
import { getPortalAccessData } from "@/lib/portalAccessCache";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (arg: boolean) => void;
}

/** Returns true only when the viewport is >= 1024px (lg breakpoint) */
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isDesktop;
};

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
}: SidebarProps) => {
  const isDesktop = useIsDesktop();

  /**
   * Collapsed mode only kicks in on desktop.
   * On mobile/tablet the sidebar always renders in expanded mode
   * and is controlled purely by sidebarOpen (slide in/out).
   */
  const effectiveCollapsed = isDesktop && sidebarCollapsed;
  const handleNavigate = () => {
    if (!isDesktop) setSidebarOpen(false);
  };

  // Persisted to avoid "blank sidebar" flicker on route changes / remounts.
  const [menuGroups, setMenuGroups] = useLocalStorage<{ name: string; menuItems: any[] }[]>(
    "sidebarMenuGroups",
    [{ name: "MENU", menuItems: [] }],
  );
  const [userType, setUserType] = useLocalStorage<string>("sidebarUserType", "");
  const [permission, setPermission] = useLocalStorage<any>("sidebarPermission", {});
  const [pageName, setPageName] = useLocalStorage("selectedMenu", "dashboard");
  const safeMenuGroups = Array.isArray(menuGroups)
    ? menuGroups
    : [{ name: "MENU", menuItems: [] }];
  const safePermission =
    permission && typeof permission === "object" ? permission : {};
  React.useEffect(() => {
    const raw = localStorage.getItem("userDetails");
    if (!raw) return;

    const userDetails = JSON.parse(raw);

    const bootstrapSidebar = async () => {
      try {
        const portalAccess = await getPortalAccessData(userDetails?.userType, {
          allowStale: true,
          backgroundRefresh: true,
        });
        setUserType(portalAccess.userType || userDetails?.userType || "");
        setPermission(portalAccess.permissions || {});
        setMenuGroups((prev) =>
          (Array.isArray(prev) ? prev : [{ name: "MENU", menuItems: [] }]).map((group) =>
            group.name === "MENU"
              ? { ...group, menuItems: portalAccess.menus || [] }
              : group,
          ),
        );
      } catch (error) {
        console.error("Failed to bootstrap sidebar:", error);
      }
    };

    bootstrapSidebar();
  }, [setMenuGroups, setPermission, setUserType]);

  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      <aside
        className={`
          fixed left-0 top-0 z-9999 flex h-screen flex-col no-scrollbar
          overflow-x-hidden
          bg-gradient-to-b from-[#0f2a3d] to-[#0b1d2b]
          shadow-xl ring-1 ring-white/5
          transition-[width,transform] duration-300 ease-in-out will-change-transform
          dark:from-[#0f2a3d] dark:to-[#0b1d2b]
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          w-[88%] sm:w-72 lg:w-72 ${effectiveCollapsed ? "lg:!w-16 overflow-visible" : "overflow-hidden"}
        `}
      >
        {/* HEADER */}
        <div className={`relative flex items-center justify-center ${effectiveCollapsed ? "h-28 flex-col" : "h-16 sm:h-20"}`}>
          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
          <Link
            href="/"
            className={`flex items-center gap-2 font-semibold text-white transition-all ${effectiveCollapsed ? "text-transparent truncate mt-4" : "text-base sm:text-xl px-4"
              }`}
            title="Production MIS"
          >
            <Image
              width={24}
              height={24}
              src="/images/icon/production-icon.svg"
              alt="Logo"
              className="flex-shrink-0"
              priority
            />
            {!effectiveCollapsed && (
              <span className="tracking-tight whitespace-nowrap">
                Production MIS
              </span>
            )}
          </Link>

          {/* Desktop collapse/expand toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-full transition-transform hover:scale-110 z-50 ${effectiveCollapsed
                ? "mt-4 text-white/50 hover:text-white"
                : "absolute top-12 mt-2 text-white shadow-md"
              }`}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${sidebarCollapsed ? "rotate-180" : ""
                }`}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        {/* NAV */}
        <div
          className={`no-scrollbar flex flex-1 min-w-0 flex-col duration-300 ease-linear ${effectiveCollapsed ? "overflow-visible" : "overflow-y-auto"
            }`}
        >
          <nav
            className={`mt-1 py-4 ${effectiveCollapsed ? "px-2" : "px-4 lg:px-6"
              }`}
          >
            {safeMenuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {effectiveCollapsed ? (
                  <div className="mb-3 border-t border-white/10" />
                ) : (
                  <h3 className="mb-3 ml-4 text-xs font-semibold uppercase tracking-wider text-white/60">
                    {group.name}
                  </h3>
                )}

                <ul className="mb-6 flex flex-col gap-1.5">
                  {(Array.isArray(group?.menuItems) ? group.menuItems : []).map((menuItem, menuIndex) => {
                    const transformedLabel = String(menuItem?.label || "")
                      .replace(/\s+/g, "_")
                      .toLowerCase();
                    const normalizedUserType = (userType || "")
                      .toLowerCase()
                      .replace(/\s+/g, "_");
                    const hasPermission =
                      safePermission[transformedLabel]?.[normalizedUserType] ??
                      normalizedUserType === "admin";

                    return (
                      hasPermission && (
                        <SidebarItem
                          key={menuIndex}
                          item={menuItem}
                          pageName={pageName}
                          permission={safePermission}
                          userType={userType}
                          setPageName={setPageName}
                          collapsed={effectiveCollapsed}
                          onNavigate={handleNavigate}
                        />
                      )
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </ClickOutside>
  );
};

export default Sidebar;

