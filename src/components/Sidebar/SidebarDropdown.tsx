import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SidebarDropdown = ({ item, permission, userType, onNavigate }: any) => {
  const pathname = usePathname();
  const items = Array.isArray(item) ? item : [];

  return (
    <>
      <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-6">
        {items.map((item: any, index: number) => {
          const transformedLabel = item?.label
            ?.replace(/\s+/g, "_")
            .toLowerCase();
          const normalizedUserType = (userType || "")
            .toLowerCase()
            .replace(/\s+/g, "_");
          const hasPermission =
            permission[transformedLabel]?.[normalizedUserType] ??
            normalizedUserType === "admin";

          return (
            hasPermission && (
              <li key={index}>
                {typeof item.route === "string" && item.route.trim() !== "" && item.route !== "#" ? (
                  <Link
                    href={item.route}
                    scroll={false}
                    onClick={() => {
                      if (typeof onNavigate === "function") onNavigate();
                    }}
                    className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                      pathname === item.route ? "text-white" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof onNavigate === "function") onNavigate();
                    }}
                    className="group relative flex w-full items-center gap-2.5 rounded-md px-4 text-left font-medium text-bodydark2 duration-300 ease-in-out hover:text-white"
                  >
                    {item.label}
                  </button>
                )}
              </li>
            )
          );
        })}
      </ul>
    </>
  );
};

export default SidebarDropdown;
