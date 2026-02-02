"use client";
import React, { ComponentType, useEffect, useState } from "react";
import { getUseTypeByType, getAllMenus } from "../../../lib/api";

interface UserRoles {
  [key: string]: { [key: string]: boolean };
}

interface MenuItem {
  label: string;
  route: string;
  children?: MenuItem[];
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
        const userDetails = JSON.parse(
          localStorage.getItem("userDetails") || "{}",
        );
        if (!userDetails || !userDetails.userType) {
          
          window.location.href = "/not-authorized";
          return;
        }

        setUserType(userDetails.userType);

        try {
          const result = await getUseTypeByType();
          const roles = result.userType[0]?.roles || {};
          setUserRoles(roles);
        } catch (error) {
          console.error("Failed to fetch user roles:", error);
        }
      };

      const fetchMenus = async () => {
        try {
          const result = await getAllMenus();
          const menus = result.getMenu[0]?.menus || [];
          setMenuGroups(menus);
        } catch (error) {
          console.error("Failed to fetch menus:", error);
        }
      };

      Promise.all([fetchUserRoles(), fetchMenus()])
        .then(() => {
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          setLoading(false);
        });
    }, []);

    useEffect(() => {
      if (
        loading ||
        !userRoles ||
        Object.keys(userRoles).length === 0 ||
        menuGroups.length === 0
      ) {
        return;
      }

      const currentPath = window.location.pathname;

      const checkAccess = (menuItem: MenuItem): boolean => {
        if (menuItem.route === currentPath) {
          const transformedLabel = menuItem.label
            .replace(/\s+/g, "_")
            .toLowerCase();
          const formattedUserType = userType.toLowerCase().replace(/\s+/g, "_");
          const accessGranted =
            userRoles[transformedLabel]?.[formattedUserType] === true;
          return accessGranted;
        }

        if (menuItem.children && menuItem.children.length > 0) {
          return menuItem.children.some(checkAccess);
        }

        return false;
      };

      const accessGranted = menuGroups.some(checkAccess);
      setHasAccess(accessGranted);
    }, [userRoles, menuGroups, userType, loading]);

    useEffect(() => {
      if (hasAccess === false) {
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
