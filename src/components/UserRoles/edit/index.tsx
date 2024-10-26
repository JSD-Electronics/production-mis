"use client";
import React, { useState } from "react";
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
  const [handleRoleName, setHandleRoleName] = useState("");
  const [selectedUserRoleType, setSelectedUserRoleType] = useState("");
  const [userRoleType, setUserRoleType] = useState([]);
  const [menus, setMenus] = useState([]);
  const [types, setTypes] = useState([]);
  const [roles, setRoles] = useState([]);
  React.useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    getUserRoles(id);
    getUsers();
    getMenus();
    getTypeUser();
  }, []);
  const getTypeUser = async () => {
    try {
      const result = await getUserType();
      setTypes(result.userType);
    } catch (error) {
      toast.error(
        error?.message || "An error occurred while creating the user role.",
      );
    }
  };
  const getMenus = async () => {
    try {
      const result = await getAllMenus();
      setMenus(result.getMenu[0].menus);
    } catch (error) {
      toast.error(
        error?.message || "An error occurred while creating the user role.",
      );
    }
  };
  const getUsers = async () => {
    try {
      const result = await getUserType();
      setUserRoleType(result.userType);

      console.log("userRoleType ==> ", userRoleType);
    } catch (error) {
      toast.error(
        error?.message || "An error occurred while creating the user role.",
      );
    }
  };
  const getUserRoles = async (id: any) => {
    try {
      let result = await getUserRolesById(id);
      if (result) {
        setRoles(result.roles);
        // setHandleRoleName(result.name || "");
        // setSelectedUserRoleType(result.userType || "");
        // setRoles(result.permissions || []);
      }
    } catch (error) {
      console.error("Failed to fetch room plan:", error);
    }
  };
  const submitForm = async (event: any) => {
    event.preventDefault();
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    try {
      const result = await updateUserRoles(roles, id);
      if (result && result.status === 200) {
        toast.success("User role Updated successfully!!");
      } else {
        throw new Error(result.message || "Failed to Update User role");
      }
    } catch (error) {
      toast.error(
        error?.message || "An error occurred while Updated the user role.",
      );
    }
  };

  const handleChange = (labelKey: any, typeName: any, isChecked: any) => {
    setRoles((prevRoles) => {
      const updatedDashboard = {
        ...prevRoles[labelKey],
        [typeName]: !prevRoles[labelKey]?.[typeName], // Corrected property access
      };
      
      return {
        ...prevRoles,
        [labelKey]: updatedDashboard,
      };
    });
  };

  return (
    <div className="grid gap-9">
      <Breadcrumb pageName="Add User Role" parentName="User Roles Management" />
      <ToastContainer
        position="top-center"
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="flex flex-col gap-9">
        <div className="rounded-sm border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              User Role Management
            </h3>
          </div>
          <form onSubmit={submitForm}>
            <div className="p-8 pr-8">
              <div>
                <div className="">
                  <div className="py-2 pt-4">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Access Manager
                    </label>
                  </div>
                  <>
                    {menus.map((menu) => (
                      <div key={menu.label} className="py-2 pt-2">
                        {/* <div className="flex grid p-4 sm:grid-cols-2"> */}
                        <div className="flex grid sm:grid-cols-2">
                          <div className="px-3">
                            <h2 className="text-md mb-1 block font-medium text-black dark:text-white">
                              {menu.label}
                            </h2>
                          </div>
                          <div className="flex gap-4">
                            {types.map((type) => (
                              <div
                                key={type.name}
                                className="items-end justify-center gap-4"
                              >
                                <CheckboxOne
                                  id={`${menu.label.replace(/\s+/g, '_').toLowerCase()}[${type.name.replace(/\s+/g, '_').toLowerCase()}]`}
                                  value={type.name.replace(/\s+/g, '_').toLowerCase()}
                                  checked={
                                    roles?.[menu.label.replace(/\s+/g, '_').toLowerCase()]?.[`${type.name.replace(/\s+/g, '_').toLowerCase()}`]
                                  }
                                  setValue={(e) =>
                                    handleChange(
                                      menu.label.replace(/\s+/g, '_').toLowerCase(),
                                      `${type.name.replace(/\s+/g, '_').toLowerCase()}`,
                                      e
                                    )
                                  }
                                />

                                {/* <CheckboxOne
                                  id={`${menu.label}[${type.name.replace(/\s+/g, "_").toLowerCase()}]`}
                                  value={type.name
                                    .replace(/\s+/g, "_")
                                    .toLowerCase()}
                                  checked={
                                    roles?.[
                                      menu.label
                                        .replace(/\s+/g, "_")
                                        .toLowerCase()
                                    ]?.[
                                      `${type.name.replace(/\s+/g, "_").toLowerCase()}`
                                    ]
                                  }
                                  setValue={(e) =>
                                    handleChange(
                                      menu.label
                                        .replace(/\s+/g, "_")
                                        .toLowerCase(),
                                      `${type.name.replace(/\s+/g, "_").toLowerCase()}`,
                                      e,
                                    )
                                  }
                                /> */}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="px-8">
                          {menu.children.length > 0 &&
                            menu.children.map((child) => (
                              <div
                                key={child.label}
                                className="flex grid sm:grid-cols-2"
                              >
                                <label
                                  key={child.label}
                                  className="mb-1 block text-sm font-medium text-black dark:text-white"
                                >
                                  {child.label}
                                </label>
                                <div className="flex gap-4">
                                  {types.map((type) => (
                                    <div
                                      key={type.name}
                                      className="items-end justify-center gap-4"
                                    >
                                      <CheckboxOne
                                        id={`${child._id}[${type.name.replace(/\s+/g, "_").toLowerCase()}]`}
                                        value={type.name
                                          .replace(/\s+/g, "_")
                                          .toLowerCase()}
                                        checked={
                                          roles?.[
                                            child.label
                                              .replace(/\s+/g, "_")
                                              .toLowerCase()
                                          ]?.[
                                            `${type.name.replace(/\s+/g, "_").toLowerCase()}`
                                          ]
                                        }
                                        setValue={(e) =>
                                          handleChange(
                                            child.label
                                              .replace(/\s+/g, "_")
                                              .toLowerCase(),
                                            `${type.name.replace(/\s+/g, "_").toLowerCase()}`,
                                            e,
                                          )
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                        {/* </div> */}
                      </div>
                    ))}
                  </>

                  {/* {roles.map((role) => (
                    <div key={role.id} className="py-2 pt-2">
                      <div className="flex grid p-4 sm:grid-cols-2">
                        <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                          {role.name}
                        </label>
                        <div className="flex items-end justify-center gap-4">
                          <CheckboxOne
                            id={`${role.id}-read`}
                            value={"Read"}
                            checked={role.permissions.Read}
                            setValue={() => handleChange(role.id, "Read")}
                          />
                          <CheckboxOne
                            id={`${role.id}-write`}
                            value={"Write"}
                            checked={role.permissions.Write}
                            setValue={() => handleChange(role.id, "Write")}
                          />
                          <CheckboxOne
                            id={`${role.id}-partially`}
                            value={"Partially"}
                            checked={role.permissions.Partially}
                            setValue={() => handleChange(role.id, "Partially")}
                          />
                        </div>
                      </div>
                    </div>
                  ))} */}
                </div>
              </div>
              <div className="col-span-2 flex justify-end p-8 pr-8">
                <button
                  type="submit"
                  className="rounded-md bg-green-700 px-4 py-2 text-white transition hover:bg-green-800"
                >
                  Update
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
