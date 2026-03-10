import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getUseTypeByType, getAllMenus } from "../../lib/api";
import Image from "next/image";
import SidebarItem from "@/components/Sidebar/SidebarItem";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (arg: boolean) => void;
}

/** Returns true only when the viewport is ≥ 1024px (lg breakpoint) */
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

  const [menuGroups, setMenuGroups] = useState<{ name: string; menuItems: any[] }[]>([{ name: "MENU", menuItems: [] }]);
  const [userType, setUserType] = useState("");
  const [permission, setPermission] = useState<any[]>([]);
  const [pageName, setPageName] = useLocalStorage("selectedMenu", "dashboard");

  React.useEffect(() => {
    const raw = localStorage.getItem("userDetails");
    if (!raw) return;
    const userDetails = JSON.parse(raw);
    getAccessPermission(userDetails.userType);
    getMenus(userDetails);
  }, []);

  const getMenus = async (user: any) => {
    try {
      const result = await getAllMenus();
      setMenuGroups((prev) =>
        prev.map((group) =>
          group.name === "MENU"
            ? { ...group, menuItems: [...result.getMenu[0].menus] }
            : group,
        ),
      );
    } catch { }
  };

  const getAccessPermission = async (userType: any) => {
    try {
      setPermission([]);
      const result = await getUseTypeByType();
      setUserType(userType);
      setPermission(result.userType[0].roles);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    }
  };

  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      <aside
        className={`
          fixed left-0 top-0 z-9999 flex h-screen flex-col
          overflow-x-visible
          bg-gradient-to-b from-[#0f2a3d] to-[#0b1d2b]
          shadow-xl ring-1 ring-white/5
          transition-[width,transform] duration-300 ease-in-out
          dark:from-[#0f2a3d] dark:to-[#0b1d2b]
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          w-full lg:w-72 ${effectiveCollapsed ? "lg:!w-16 overflow-visible" : "overflow-hidden"}
        `}
      >
        {/* ── HEADER ── */}
        <div className={`relative flex items-center justify-center ${effectiveCollapsed ? "h-28 flex-col" : "h-20"}`}>
          <Link
            href="/"
            className={`flex items-center gap-2 font-semibold text-white transition-all ${effectiveCollapsed ? "text-transparent truncate mt-4" : "text-xl px-4"
              }`}
            title="Production MIS"
          >
            <Image
              width={28}
              height={28}
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
                : "absolute right-[-12px] top-7 bg-white text-gray-800 shadow-md ring-1 ring-gray-200"
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

          {/* Mobile close button — hidden on desktop */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="block absolute right-4 lg:hidden text-white/70 hover:text-white"
          >
            <svg
              className="fill-current"
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z" />
            </svg>
          </button>
        </div>

        {/* ── NAV ── */}
        <div
          className={`no-scrollbar flex flex-1 flex-col duration-300 ease-linear ${effectiveCollapsed ? "overflow-visible" : "overflow-y-auto"
            }`}
        >
          <nav
            className={`mt-1 py-4 ${effectiveCollapsed ? "px-2" : "px-4 lg:px-6"
              }`}
          >
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {effectiveCollapsed ? (
                  <div className="mb-3 border-t border-white/10" />
                ) : (
                  <h3 className="mb-3 ml-4 text-xs font-semibold uppercase tracking-wider text-white/60">
                    {group.name}
                  </h3>
                )}

                <ul className="mb-6 flex flex-col gap-1.5">
                  {group.menuItems.map((menuItem, menuIndex) => {
                    const transformedLabel = menuItem.label
                      .replace(/\s+/g, "_")
                      .toLowerCase();
                    const normalizedUserType = (userType || "")
                      .toLowerCase()
                      .replace(/\s+/g, "_");
                    const hasPermission =
                      permission[transformedLabel]?.[normalizedUserType] ??
                      normalizedUserType === "admin";

                    return (
                      hasPermission && (
                        <SidebarItem
                          key={menuIndex}
                          item={menuItem}
                          pageName={pageName}
                          permission={permission}
                          userType={userType}
                          setPageName={setPageName}
                          collapsed={effectiveCollapsed}
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
