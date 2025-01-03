import React, { ReactNode, useState } from "react";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

const Layout = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen">
      <div
        className={`bg-gray-800 text-white transition-all duration-300 ${
          isOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          {isOpen && <span className="text-xl font-bold">Menu</span>}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 hover:bg-gray-700"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        <nav className="mt-4">
          {/* Add your menu items here */}
          <div
            className={`p-4 hover:bg-gray-700 cursor-pointer ${
              !isOpen && "justify-center"
            } flex items-center`}
          >
            <Menu size={20} />
            {isOpen && <span className="ml-2">Menu Item</span>}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
