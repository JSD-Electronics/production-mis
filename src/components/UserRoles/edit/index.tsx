"use client";
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import {
  updateUserRoles,
  getUserRolesById,
  getUserType,
  getAllMenus,
} from "../../../lib/api";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CheckboxOne from "@/components/Checkboxes/CheckboxOne";

const EditUserRoles = () => {
  const [menus, setMenus] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, any>>({});

  useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    getUserRoles(id);
    getMenus();
    getTypeUser();
  }, []);

  const getTypeUser = async () => {
    try {
      const result = await getUserType();
      setTypes(result.userType);
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch user types.");
    }
  };

  const getMenus = async () => {
    try {
      const result = await getAllMenus();
      setMenus(result.getMenu[0].menus);
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch menus.");
    }
  };

  const getUserRoles = async (id: any) => {
    try {
      const result = await getUserRolesById(id);
      if (result) {
        setRoles(result.roles);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const submitForm = async (event: any) => {
    event.preventDefault();
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    try {
      const result = await updateUserRoles(roles, id);
      if (result && result.status === 200) {
        toast.success("User role updated successfully!");
      } else {
        throw new Error(result.message || "Failed to update role");
      }
    } catch (error: any) {
      toast.error(error?.message || "Error while updating role.");
    }
  };

  // Handles both parent & child changes
  const handleChange = (
    labelKey: string,
    typeName: string,
    isChecked: boolean,
    children: any[] = []
  ) => {
    setRoles((prevRoles) => {
      const updated = { ...prevRoles };

      // Update parent
      updated[labelKey] = {
        ...updated[labelKey],
        [typeName]: isChecked,
      };

      // Update children if parent is toggled
      if (children.length > 0) {
        children.forEach((child) => {
          const childKey = child.label.replace(/\s+/g, "_").toLowerCase();
          updated[childKey] = {
            ...updated[childKey],
            [typeName]: isChecked,
          };
        });
      }

      return updated;
    });
  };

  return (
    <div className="grid gap-3.5">
      <Breadcrumb pageName="Edit User Role" parentName="User Roles Management" />
      <ToastContainer
        position="top-center"
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="flex flex-col gap-9">
        <div className="rounded-lg border border-gray-200 bg-white shadow-md dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-strokedark">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              User Role Management
            </h3>
          </div>

          <form onSubmit={submitForm}>
            <div className="p-6 space-y-6">
              {menus.map((menu) => {
                const parentKey = menu.label.replace(/\s+/g, "_").toLowerCase();
                return (
                  <div
                    key={menu.label}
                    className="rounded-md border border-gray-100 bg-gray-50 p-4 dark:border-strokedark dark:bg-boxdark/40"
                  >
                    {/* Parent */}
                    <div className="flex items-center justify-between">
                      <h2 className="text-md font-medium text-gray-800 dark:text-white">
                        {menu.label}
                      </h2>
                      <div className="flex gap-4">
                        {types.map((type) => {
                          const typeKey = type.name.replace(/\s+/g, "_").toLowerCase();
                          return (
                            <CheckboxOne
                              key={typeKey}
                              id={`${parentKey}_${typeKey}`}
                              value={typeKey}
                              checked={roles?.[parentKey]?.[typeKey] || false}
                              setValue={(checked) =>
                                handleChange(parentKey, typeKey, checked, menu.children)
                              }
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Children */}
                    {menu.children.length > 0 && (
                      <div className="mt-3 space-y-3 pl-6 border-l-2 border-gray-300 dark:border-gray-600">
                        {menu.children.map((child) => {
                          const childKey = child.label
                            .replace(/\s+/g, "_")
                            .toLowerCase();
                          return (
                            <div
                              key={child.label}
                              className="flex items-center justify-between"
                            >
                              <label className="text-sm text-gray-700 dark:text-gray-300">
                                {child.label}
                              </label>
                              <div className="flex gap-4">
                                {types.map((type) => {
                                  const typeKey = type.name
                                    .replace(/\s+/g, "_")
                                    .toLowerCase();
                                  return (
                                    <CheckboxOne
                                      key={typeKey}
                                      id={`${childKey}_${typeKey}`}
                                      value={typeKey}
                                      checked={roles?.[childKey]?.[typeKey] || false}
                                      setValue={(checked) =>
                                        handleChange(childKey, typeKey, checked)
                                      }
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-md bg-green-600 px-5 py-2 text-white shadow hover:bg-green-700"
                >
                  Update Role
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserRoles;


