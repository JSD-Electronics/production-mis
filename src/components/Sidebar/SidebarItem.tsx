import React, { useEffect, useMemo, useRef, useState } from "react";
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
  onNavigate,
}: any) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const itemChildren = Array.isArray(item?.children) ? item.children : [];

  const handleClick = () => {
    const updatedPageName =
      pageName !== item.label.toLowerCase() ? item.label.toLowerCase() : "";
    setPageName(updatedPageName);
    if (typeof onNavigate === "function") onNavigate();
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
    const decoded = useMemo(
      () =>
        (svgString || "")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#x2F;/g, "/")
          .replace(/&amp;/g, "&"),
      [svgString],
    );
    const [safeSvg, setSafeSvg] = useState<string | null>(null);

    useEffect(() => {
      if (!decoded || typeof window === "undefined") {
        setSafeSvg(null);
        return;
      }

      try {
        const parser = new window.DOMParser();
        const doc = parser.parseFromString(decoded, "image/svg+xml");
        const svg = doc.querySelector("svg");
        const parserError = doc.querySelector("parsererror");

        if (!svg || parserError) {
          setSafeSvg(null);
          return;
        }

        const pathNodes = Array.from(svg.querySelectorAll("path"));
        const allPathsValid = pathNodes.every((node) => {
          const d = node.getAttribute("d") || "";
          if (!d.trim()) return true;
          try {
            const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathEl.setAttribute("d", d);
            pathEl.getTotalLength();
            return true;
          } catch {
            return false;
          }
        });

        setSafeSvg(allPathsValid ? svg.outerHTML : null);
      } catch {
        setSafeSvg(null);
      }
    }, [decoded]);

    if (!safeSvg) {
      return <span className="inline-block h-[18px] w-[18px]" aria-hidden="true" />;
    }

    return <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: safeSvg }} />;
  };

  const isItemActive = isActive(item);
  const hasChildren = itemChildren.length > 0;
  const isRoutable = typeof item.route === "string" && item.route.trim() !== "" && item.route !== "#";

  const openTooltip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTooltipOpen(true);
  };
  const closeTooltip = () => {
    timerRef.current = setTimeout(() => setTooltipOpen(false), 120);
  };

  if (collapsed) {
    return (
      <>
        {hasPermission && (
          <li
            className="relative"
            onMouseEnter={openTooltip}
            onMouseLeave={closeTooltip}
          >
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

            {(tooltipOpen || (collapsed && pageName === item.label.toLowerCase())) && (
              <div
                className="absolute left-full top-0 ml-3 z-[10000]"
                onMouseEnter={openTooltip}
                onMouseLeave={closeTooltip}
              >
                <div className="absolute -left-3 top-0 h-full w-3" />
                <span className="absolute -left-[5px] top-4 w-0 h-0 border-y-[5px] border-y-transparent border-r-[5px] border-r-gray-800" />

                {hasChildren ? (
                  <div className="min-w-[180px] rounded-xl overflow-hidden bg-gray-800 shadow-2xl ring-1 ring-white/10 border border-white/5">
                    <div className="px-4 py-2.5 bg-gray-700/50 border-b border-white/10">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                        {item.label}
                      </span>
                    </div>
                    <ul className="py-1.5">
                      {itemChildren.map((child: any, idx: number) => {
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
                                onClick={() => {
                                  setPageName("");
                                  if (typeof onNavigate === "function") onNavigate();
                                }}
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

  return (
    <>
      {hasPermission && (
        <li>
          {hasChildren || !isRoutable ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleClick();
              }}
              className={`group relative flex w-full items-center gap-2.5 rounded-lg px-4 py-2 text-left font-medium duration-200 ease-in-out ${isItemActive
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
            </button>
          ) : (
            <Link
              href={item.route}
              onClick={handleClick}
              prefetch
              scroll={false}
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
            </Link>
          )}

          {hasChildren && (
            <div
              className={`translate transform overflow-hidden pl-4 ${pageName !== item.label.toLowerCase() ? "hidden" : ""
                }`}
            >
              <SidebarDropdown
                item={itemChildren}
                permission={permission}
                userType={userType}
                onNavigate={onNavigate}
              />
            </div>
          )}
        </li>
      )}
    </>
  );
};

export default SidebarItem;
