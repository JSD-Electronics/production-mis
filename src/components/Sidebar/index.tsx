import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getUseTypeByType,getAllMenus } from "../../lib/api";
import Image from "next/image";
import SidebarItem from "@/components/Sidebar/SidebarItem";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}
const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const[menuGroups,setMenuGroups] = useState([
      {
        name: "MENU",
        menuItems: [],
      }]);
  const pathname = usePathname();
  const [userType,setUserType] = useState("");
  const [permission,setPermission] = useState([]); 
  const [pageName, setPageName] = useLocalStorage("selectedMenu", "dashboard");
  React.useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    getAccessPermission(userDetails.userType);
    getMenus(userDetails);
  }, []);   
  const getMenus = async (user:any) =>{
    try {
      let result = await getAllMenus();
      const menuItems = [];
      setMenuGroups((prevMenuGroups) => {
        const updatedMenuGroups = prevMenuGroups.map((group) => {
          if (group.name === "MENU") {
            return {
              ...group,
              menuItems: [
                ...menuItems,
                ...result.getMenu[0].menus,
              ],
            };
          }
          return group;
        });
        return updatedMenuGroups;
      });
    } catch (error) {
      console.log("Failed to fetch Room Plan :", error);
    }
  };
  const getAccessPermission = async (userType: any) => {
    try {
      setPermission([]);
      let result = await getUseTypeByType();
      setUserType(userType);
      setPermission(result.userType[0].roles); 
    } catch (error) {
      console.error("Failed to fetch room plan:", error);
    }
  };
  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      
      <aside
        className={`fixed left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* <!-- SIDEBAR HEADER --> */}
        <div className="flex items-center justify-center gap-2 px-6 py-5.5 lg:py-6.5">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-medium text-gray"
          >
            <Image
              width={32}
              height={10}
              src={"/images/icon/production-icon.svg"}
              alt="Logo"
              priority
            />
            Production MIS
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            className="block lg:hidden"
          >
            <svg
              className="fill-current"
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
                fill=""
              />
            </svg>
          </button>
        </div>
        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          <nav className="mt-1 px-4 py-4 lg:mt-1 lg:px-6">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
                  {group.name}
                </h3>
                <ul className="mb-6 flex flex-col gap-1.5">
                {group.menuItems.map((menuItem, menuIndex) => {
                    const transformedLabel = menuItem.label.replace(/\s+/g, '_').toLowerCase();
                    const hasPermission = permission[transformedLabel]?.[userType.toLowerCase()];
                    return (
                      hasPermission && (
                        <SidebarItem
                          key={menuIndex}
                          item={menuItem}
                          pageName={pageName}
                          permission ={permission}
                          userType={userType}
                          setPageName={setPageName}
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
    </ClickOutside>
  );
};

export default Sidebar;
