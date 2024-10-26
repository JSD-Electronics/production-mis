import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SidebarDropdown = ({ item, permission, userType }: any) => {
  const pathname = usePathname();

  return (
    <>
      <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-6">
        {item.map((item: any, index: number) => {
          const transformedLabel = item?.label
            ?.replace(/\s+/g, "_")
            .toLowerCase();
          const hasPermission =
            permission[transformedLabel]?.[userType.toLowerCase()];

          return (
            hasPermission && (
              <li key={index}>
                <Link
                  href={item.route}
                  className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                    pathname === item.route ? "text-white" : ""
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            )
          );
        })}
      </ul>
    </>
  );
};

export default SidebarDropdown;
