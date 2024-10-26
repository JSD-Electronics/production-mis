"use client";
import React, { ComponentType, useEffect, useState } from "react";
import { getUseTypeByType, getAllMenus } from "../../../lib/api";

interface UserRoles {
  [key: string]: { [key: string]: boolean };
}

interface MenuItem {
  label: string;
  route: string;
  children?: MenuItem[]; // Array of MenuItem, allowing for nested structure
}

const withAuth = (WrappedComponent: ComponentType<any>) => {
  const AuthHOC: React.FC<any> = (props) => {
    const [userType, setUserType] = useState<string>("");
    const [userRoles, setUserRoles] = useState<UserRoles>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [menuGroups, setMenuGroups] = useState<MenuItem[]>([]);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    useEffect(() => {
      const fetchUserRoles = async () => {
        const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
        if (!userDetails || !userDetails.userType) {
          console.log("User details not found or user type is missing.");
          window.location.href = "/not-authorized";
          return;
        }

        setUserType(userDetails.userType);

        try {
          const result = await getUseTypeByType();
          const roles = result.userType[0]?.roles || {};
          setUserRoles(roles);
          console.log("Fetched User Roles:", roles);
        } catch (error) {
          console.error("Failed to fetch user roles:", error);
        }
      };

      const fetchMenus = async () => {
        try {
          const result = await getAllMenus();
          const menus = result.getMenu[0]?.menus || [];
          setMenuGroups(menus);
          console.log("Fetched Menus:", menus);
        } catch (error) {
          console.error("Failed to fetch menus:", error);
        }
      };

      Promise.all([fetchUserRoles(), fetchMenus()]).then(() => {
        setLoading(false); // Set loading to false after both fetches complete
      }).catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false); // Ensure loading is set to false even if there's an error
      });
    }, []);

    useEffect(() => {
      if (loading || !userRoles || Object.keys(userRoles).length === 0 || menuGroups.length === 0) {
        return; // Wait until loading is false and data is ready
      }

      const currentPath = window.location.pathname;

      const checkAccess = (menuItem: MenuItem): boolean => {
        if (menuItem.route === currentPath) {
          const transformedLabel = menuItem.label.replace(/\s+/g, "_").toLowerCase();
          const accessGranted = userRoles[transformedLabel]?.[userType.toLowerCase()] === true;

          console.log(`Checking access for ${menuItem.label} at ${menuItem.route}:`, accessGranted);
          return accessGranted;
        }

        // Recursively check children if the menu item has children
        if (menuItem.children && menuItem.children.length > 0) {
          return menuItem.children.some(checkAccess);
        }

        return false; // Default case if no match found
      };

      const accessGranted = menuGroups.some(checkAccess);
      console.log("Overall Access Granted:", accessGranted);
      setHasAccess(accessGranted);
    }, [userRoles, menuGroups, userType, loading]);

    useEffect(() => {
      if (hasAccess === false) {
        console.log("Access denied, redirecting to /not-authorized");
        window.location.href = "/not-authorized";
      }
    }, [hasAccess]);

    if (loading) {
      return <div>Loading...</div>;
    }

    return hasAccess === true ? <WrappedComponent {...props} /> : null;
  };

  return AuthHOC;
};

export default withAuth;
