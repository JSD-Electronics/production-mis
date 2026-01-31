import Link from "next/link";
import Image from "next/image";
import DarkModeSwitcher from "./DarkModeSwitcher";
import DropdownMessage from "./DropdownMessage";
import DropdownNotification from "./DropdownNotification";
import DropdownUser from "./DropdownUser";
import { CONFIG } from "@/config";

const Header = ({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean | string | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  return (
    <header className="sticky top-0 z-50 flex w-full items-center bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm ring-1 ring-black/5 dark:bg-boxdark/80">
      <div className="flex flex-grow items-center justify-between px-4 py-2 md:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {/* Environment Indicator */}
          {CONFIG.ENVIRONMENT !== "production" && (
            <div className="hidden xsm:block">
              <span className="inline-flex items-center rounded-md bg-yellow-400/10 px-2 py-1 text-xs font-medium text-yellow-600 ring-1 ring-inset ring-yellow-400/20">
                {CONFIG.ENVIRONMENT.toUpperCase()}
              </span>
            </div>
          )}
          {/* Hamburger Button */}
          <button
            aria-controls="sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 flex h-10 w-10 items-center justify-center rounded-md border bg-white/90 shadow-sm transition dark:border-strokedark dark:bg-boxdark dark:text-white lg:hidden"
          >
            <span className="sr-only">Toggle sidebar</span>
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              {sidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Logo (Mobile only) */}
          <Link href="/" className="block flex-shrink-0">
            <Image
              width={32}
              height={32}
              src="/images/logo/logo-icon.svg"
              alt="Logo"
            />
          </Link>
        </div>

        {/* Search Bar (hidden on mobile) */}
        <div className="hidden max-w-md flex-grow px-4 md:block">
          <form action="#" method="POST">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="border-gray-300 bg-gray-50 w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-strokedark dark:bg-boxdark dark:text-white"
              />
              <span className="text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 3.5a7.5 7.5 0 0013.15 13.15z"
                  />
                </svg>
              </span>
            </div>
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 list-none">
          <DarkModeSwitcher />
          <DropdownNotification />
          <DropdownMessage />
          <DropdownUser />
        </div>
      </div>
    </header>
  );
};

export default Header;
