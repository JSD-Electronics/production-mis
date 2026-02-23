"use client";
import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import {
  updateUserRoles,
  getUserRolesById,
  getUserType,
  getAllMenus,
} from "../../../lib/api";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Search, Shield, ChevronRight, CheckSquare, Square, CheckCircle2 } from "lucide-react";

const EditUserRoles = () => {
  const [menus, setMenus] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    fetchData(id);
  }, []);

  const fetchData = async (id: any) => {
    setLoading(true);
    try {
      const [typeRes, menuRes, roleRes] = await Promise.all([
        getUserType(),
        getAllMenus(),
        getUserRolesById(id),
      ]);

      setTypes(typeRes.userType || []);
      setMenus(menuRes.getMenu?.[0]?.menus || []);
      if (roleRes) {
        setRoles(roleRes.roles || {});
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const submitForm = async (event: any) => {
    event.preventDefault();
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    try {
      const result = await updateUserRoles(roles, id);
      if (result && result.status === 200) {
        toast.success("Permissions updated successfully!");
      } else {
        throw new Error(result.message || "Failed to update permissions");
      }
    } catch (error: any) {
      toast.error(error?.message || "Error while updating permissions.");
    }
  };

  const togglePermission = (menuKey: string, typeKey: string) => {
    setRoles((prev) => ({
      ...prev,
      [menuKey]: {
        ...(prev[menuKey] || {}),
        [typeKey]: !prev[menuKey]?.[typeKey],
      },
    }));
  };

  const toggleRow = (menuItem: any, isChecked: boolean) => {
    const menuKey = menuItem.label.replace(/\s+/g, "_").toLowerCase();
    setRoles((prev) => {
      const updated = { ...prev };
      const newPermissions = types.reduce((acc, type) => {
        const typeKey = type.name.replace(/\s+/g, "_").toLowerCase();
        acc[typeKey] = isChecked;
        return acc;
      }, {} as any);

      updated[menuKey] = newPermissions;

      // Handle children if it's a parent
      if (menuItem.children && menuItem.children.length > 0) {
        menuItem.children.forEach((child: any) => {
          const childKey = child.label.replace(/\s+/g, "_").toLowerCase();
          updated[childKey] = { ...newPermissions };
        });
      }
      return updated;
    });
  };

  const toggleColumn = (typeKey: string, isChecked: boolean) => {
    setRoles((prev) => {
      const updated = { ...prev };
      menus.forEach((menu) => {
        const parentKey = menu.label.replace(/\s+/g, "_").toLowerCase();
        updated[parentKey] = { ...(updated[parentKey] || {}), [typeKey]: isChecked };

        if (menu.children) {
          menu.children.forEach((child: any) => {
            const childKey = child.label.replace(/\s+/g, "_").toLowerCase();
            updated[childKey] = { ...(updated[childKey] || {}), [typeKey]: isChecked };
          });
        }
      });
      return updated;
    });
  };

  const filteredMenus = useMemo(() => {
    if (!searchQuery) return menus;
    const query = searchQuery.toLowerCase();
    return menus.filter(menu => {
      const menuMatch = menu.label.toLowerCase().includes(query);
      const childMatch = menu.children?.some((child: any) =>
        child.label.toLowerCase().includes(query)
      );
      return menuMatch || childMatch;
    });
  }, [menus, searchQuery]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Breadcrumb pageName="Configure Permissions" parentName="User Roles Management" />
      <ToastContainer position="top-center" autoClose={3000} />

      <div className="mt-6 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-boxdark dark:border-strokedark">
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search menus or pages..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-meta-4 dark:border-strokedark"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-xs font-bold text-green-700">RBAC ACTIVE</span>
            </div>
            <button
              onClick={submitForm}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-opacity-90 transition-all active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-strokedark dark:bg-boxdark">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-20 bg-gray-50 dark:bg-meta-4 border-b border-gray-200 dark:border-strokedark shadow-sm">
                <tr>
                  <th className="min-w-[300px] p-5">
                    <div className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      Menu / Module Name
                    </div>
                  </th>
                  {types.map((type) => {
                    const typeKey = type.name.replace(/\s+/g, "_").toLowerCase();
                    return (
                      <th key={typeKey} className="group p-5 text-center min-w-[120px]">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-200 whitespace-nowrap">
                            {type.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const someUnchecked = menus.some(m => {
                                const pk = m.label.replace(/\s+/g, "_").toLowerCase();
                                if (!roles[pk]?.[typeKey]) return true;
                                return m.children?.some((c: any) => {
                                  const ck = c.label.replace(/\s+/g, "_").toLowerCase();
                                  return !roles[ck]?.[typeKey];
                                });
                              });
                              toggleColumn(typeKey, someUnchecked);
                            }}
                            className="text-[10px] font-bold text-primary hover:underline"
                          >
                            Set All
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-strokedark">
                {filteredMenus.map((menu) => {
                  const parentKey = menu.label.replace(/\s+/g, "_").toLowerCase();
                  return (
                    <React.Fragment key={menu.label}>
                      {/* Parent Row */}
                      <tr className="bg-white hover:bg-gray-50/50 transition-colors group dark:bg-boxdark dark:hover:bg-boxdark/60">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              {menu.children?.length > 0 ? <Shield className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-800 dark:text-white">
                                {menu.label}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const someUnchecked = types.some(t => {
                                    const tk = t.name.replace(/\s+/g, "_").toLowerCase();
                                    return !roles[parentKey]?.[tk];
                                  });
                                  toggleRow(menu, someUnchecked);
                                }}
                                className="text-[10px] text-left text-gray-400 hover:text-primary transition-colors"
                              >
                                Toggle all roles for this module
                              </button>
                            </div>
                          </div>
                        </td>
                        {types.map((type) => {
                          const typeKey = type.name.replace(/\s+/g, "_").toLowerCase();
                          const isChecked = roles[parentKey]?.[typeKey] || false;
                          return (
                            <td key={typeKey} className="p-5 text-center">
                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => togglePermission(parentKey, typeKey)}
                                  className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all ${isChecked
                                    ? "border-primary bg-primary text-white shadow-sm shadow-primary/20"
                                    : "border-gray-200 bg-white hover:border-gray-300 dark:bg-transparent dark:border-strokedark"
                                    }`}
                                >
                                  {isChecked && <CheckSquare className="h-4 w-4" />}
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Children Rows */}
                      {menu.children?.map((child: any) => {
                        const childKey = child.label.replace(/\s+/g, "_").toLowerCase();
                        return (
                          <tr key={child.label} className="bg-gray-50/30 dark:bg-meta-4/10 hover:bg-gray-50 transition-colors dark:hover:bg-meta-4/20">
                            <td className="py-4 pl-16 pr-5">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {child.label}
                                </span>
                              </div>
                            </td>
                            {types.map((type) => {
                              const typeKey = type.name.replace(/\s+/g, "_").toLowerCase();
                              const isChecked = roles[childKey]?.[typeKey] || false;
                              return (
                                <td key={typeKey} className="p-4 text-center">
                                  <div className="flex justify-center">
                                    <button
                                      type="button"
                                      onClick={() => togglePermission(childKey, typeKey)}
                                      className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${isChecked
                                        ? "border-primary bg-primary text-white shadow-sm"
                                        : "border-gray-300 bg-white hover:border-gray-400 dark:bg-transparent dark:border-strokedark"
                                        }`}
                                    >
                                      {isChecked && <CheckSquare className="h-3.5 w-3.5" />}
                                    </button>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredMenus.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Shield className="h-12 w-12 opacity-10" />
              <p className="mt-2 text-sm italic">No matching menus found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditUserRoles;


