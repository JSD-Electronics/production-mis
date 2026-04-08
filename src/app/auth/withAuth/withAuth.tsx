"use client";
import React, { ComponentType, useEffect, useState } from "react";
import { CenteredSkeleton } from "@/components/common/Skeletons";
import {
  getPortalAccessData,
  normalizeRoutePath,
} from "@/lib/portalAccessCache";

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
      const loadPortalAccess = async () => {
        const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
        if (!userDetails?.userType) {
          window.location.href = "/not-authorized";
          return;
        }

        try {
          const portalAccess = await getPortalAccessData(userDetails.userType, {
            allowStale: true,
            backgroundRefresh: true,
          });
          setUserType(portalAccess.userType);
          setUserRoles(portalAccess.permissions || {});
          setMenuGroups((portalAccess.menus || []) as MenuItem[]);
        } catch (error) {
          console.error("Failed to bootstrap portal access:", error);
        }
      };

      loadPortalAccess()
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

      const currentPath = normalizeRoutePath(window.location.pathname);

      const checkAccess = (menuItem: MenuItem): boolean => {
        if (normalizeRoutePath(menuItem.route) === currentPath) {
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
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-boxdark-2">
          <CenteredSkeleton />
        </div>
      );
    }

    return hasAccess === true ? <WrappedComponent {...props} /> : null;
  };

  return AuthHOC;
};

export default withAuth;
