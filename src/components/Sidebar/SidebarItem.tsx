import React from "react";
import Link from "next/link";
import SidebarDropdown from "@/components/Sidebar/SidebarDropdown";
import { usePathname } from "next/navigation";

const SidebarItem = ({
  item,
  pageName,
  setPageName,
  permission,
  userType,
}: any) => {
  const handleClick = () => {
    const updatedPageName =
      pageName !== item.label.toLowerCase() ? item.label.toLowerCase() : "";
    return setPageName(updatedPageName);
  };

  const pathname = usePathname();
  const transformedLabel = item.label.replace(/\s+/g, "_").toLowerCase();
  const normalizedUserType = (userType || "")
    .toLowerCase()
    .replace(/\s+/g, "_");
  const hasPermission =
    permission[transformedLabel]?.[normalizedUserType] ??
    normalizedUserType === "admin";
  const isActive = (item: any) => {
    if (item.route === pathname) return true;
    if (item.children) {
      return item.children.some((child: any) => isActive(child));
    }
    return false;
  };
  const SvgIcon = ({ svgString }) => {
    const decodedSvg = svgString
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x2F;/g, "/")
      .replace(/&amp;/g, "&");

    return <div dangerouslySetInnerHTML={{ __html: decodedSvg }} />;
  };
  const isItemActive = isActive(item);

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
              className={`absolute left-0 top-0 h-full w-1 rounded-r ${isItemActive ? "bg-blue-500" : "bg-transparent group-hover:bg-blue-500/60"
                }`}
            />
            <SvgIcon svgString={item.icon} />
            {item.label}
            {item.children.length > 0 && (
              <svg
                className={`absolute right-4 top-1/2 -translate-y-1/2 fill-white/70 transition-transform ${pageName === item.label.toLowerCase() && "rotate-180"
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

          {item.children.length > 0 && (
            <div
              className={`translate transform overflow-hidden pl-4 ${pageName !== item.label.toLowerCase() && "hidden"
                }`}
            >
              <SidebarDropdown item={item.children} permission={permission} userType={userType} />
            </div>
          )}
        </li>
      )}
    </>
  );
};

export default SidebarItem;
