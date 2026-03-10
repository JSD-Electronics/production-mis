import React, { useState, useRef } from "react";
import Link from "next/link";
import SidebarDropdown from "@/components/Sidebar/SidebarDropdown";
import { usePathname } from "next/navigation";

const SidebarItem = ({
  item,
  pageName,
  setPageName,
  permission,
  userType,
  collapsed,
}: any) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const handleClick = () => {
    const updatedPageName =
      pageName !== item.label.toLowerCase() ? item.label.toLowerCase() : "";
    setPageName(updatedPageName);
  };

  const transformedLabel = item.label.replace(/\s+/g, "_").toLowerCase();
  const normalizedUserType = (userType || "").toLowerCase().replace(/\s+/g, "_");
  const hasPermission =
    permission[transformedLabel]?.[normalizedUserType] ?? normalizedUserType === "admin";

  const isActive = (node: any): boolean => {
    if (node.route === pathname) return true;
    if (node.children?.length) return node.children.some((c: any) => isActive(c));
    return false;
  };

  const SvgIcon = ({ svgString }: { svgString: string }) => {
    const decoded = svgString
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x2F;/g, "/")
      .replace(/&amp;/g, "&");
    return <div dangerouslySetInnerHTML={{ __html: decoded }} />;
  };

  const isItemActive = isActive(item);
  const hasChildren = item.children?.length > 0;

  const openTooltip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTooltipOpen(true);
  };
  const closeTooltip = () => {
    timerRef.current = setTimeout(() => setTooltipOpen(false), 120);
  };

  // ─────────────────────────────────────────────────────────────────────
  //  COLLAPSED mode — icon rail with tooltip / tooltip+submenu flyout
  // ─────────────────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <>
        {hasPermission && (
          <li
            className="relative"
            onMouseEnter={openTooltip}
            onMouseLeave={closeTooltip}
          >
            {/* Icon button */}
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleClick();
                }}
                className={`flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-all duration-150 ${isItemActive
                  ? "bg-white/15 text-white"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
              >
                {isItemActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r bg-blue-400" />
                )}
                <SvgIcon svgString={item.icon} />
              </button>
            ) : (
              <Link
                href={item.route}
                onClick={handleClick}
                className={`flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-all duration-150 ${isItemActive
                  ? "bg-white/15 text-white"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
              >
                {isItemActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r bg-blue-400" />
                )}
                <SvgIcon svgString={item.icon} />
              </Link>
            )}

            {/* ── Tooltip / Flyout ── */}
            {(tooltipOpen || (collapsed && pageName === item.label.toLowerCase())) && (
              <div
                className="absolute left-full top-0 ml-3 z-[10000]"
                onMouseEnter={openTooltip}
                onMouseLeave={closeTooltip}
              >
                {/* A transparent bridge to help move the mouse from sidebar to pop-up */}
                <div className="absolute -left-3 top-0 h-full w-3" />

                {/* Arrow pointing left */}
                <span className="absolute -left-[5px] top-4 w-0 h-0 border-y-[5px] border-y-transparent border-r-[5px] border-r-gray-800" />

                {hasChildren ? (
                  /* ── Submenu tooltip panel ── */
                  <div className="min-w-[180px] rounded-xl overflow-hidden bg-gray-800 shadow-2xl ring-1 ring-white/10 border border-white/5">
                    {/* Section header */}
                    <div className="px-4 py-2.5 bg-gray-700/50 border-b border-white/10">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                        {item.label}
                      </span>
                    </div>
                    {/* Child links */}
                    <ul className="py-1.5">
                      {item.children.map((child: any, idx: number) => {
                        const childLabel = child?.label
                          ?.replace(/\s+/g, "_")
                          .toLowerCase();
                        const childPermission =
                          permission[childLabel]?.[normalizedUserType] ??
                          normalizedUserType === "admin";

                        return (
                          childPermission && (
                            <li key={idx}>
                              <Link
                                href={child.route}
                                onClick={() => setPageName("")}
                                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-100 ${pathname === child.route
                                  ? "bg-blue-500/10 text-blue-400 font-medium"
                                  : "text-white/70 hover:bg-white/5 hover:text-white"
                                  }`}
                              >
                                {pathname === child.route && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                )}
                                {child.label}
                              </Link>
                            </li>
                          )
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  /* ── Simple label tooltip ── */
                  <div className="whitespace-nowrap rounded-lg bg-gray-800 px-3.5 py-2 text-xs font-semibold text-white shadow-2xl ring-1 ring-white/10 border border-white/5">
                    {item.label}
                  </div>
                )}
              </div>
            )}
          </li>
        )}
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  //  EXPANDED mode — original full layout
  // ─────────────────────────────────────────────────────────────────────
  return (
    <>
      {hasPermission && (
        <li>
          <Link
            href={item.route}
            onClick={handleClick}
            className={`group relative flex items-center gap-2.5 rounded-lg px-4 py-2 font-medium duration-200 ease-in-out ${isItemActive
              ? "bg-white/10 text-white shadow-inner"
              : "text-white/80 hover:bg-white/5 hover:text-white"
              }`}
          >
            <span
              className={`absolute left-0 top-0 h-full w-1 rounded-r ${isItemActive
                ? "bg-blue-500"
                : "bg-transparent group-hover:bg-blue-500/60"
                }`}
            />
            <SvgIcon svgString={item.icon} />
            <span className="flex-1">{item.label}</span>
            {hasChildren && (
              <svg
                className={`fill-white/70 transition-transform ${pageName === item.label.toLowerCase() ? "rotate-180" : ""
                  }`}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                  fill=""
                />
              </svg>
            )}
          </Link>

          {hasChildren && (
            <div
              className={`translate transform overflow-hidden pl-4 ${pageName !== item.label.toLowerCase() ? "hidden" : ""
                }`}
            >
              <SidebarDropdown
                item={item.children}
                permission={permission}
                userType={userType}
              />
            </div>
          )}
        </li>
      )}
    </>
  );
};

export default SidebarItem;
