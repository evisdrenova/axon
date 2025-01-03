import React, { ReactNode, useState } from "react";
import { Brain, ChevronLeft, ChevronRight, Home, Server } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface Props {
  children: ReactNode;
}

export default function Layout(props: Props) {
  const { children } = props;
  const [isOpen, setIsOpen] = useState(true);

  const navItems = [
    { path: "/", icon: <Home size={20} />, label: "Home" },
    { path: "/servers", icon: <Server size={20} />, label: "Servers" },
    { path: "/providers", icon: <Brain size={20} />, label: "Providers" },
  ];

  const location = useLocation();

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
          {navItems.map(({ path, icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`p-4 hover:bg-gray-700 cursor-pointer flex items-center ${
                location.pathname === path ? "bg-gray-700" : ""
              }`}
            >
              {icon}
              {isOpen && <span className="ml-2">{label}</span>}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-auto bg-gray-100">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
