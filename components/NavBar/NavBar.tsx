import { Box, MessagesSquare, Settings2, Wrench } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface Props {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export default function NavBar(props: Props) {
  const navItems = [
    { path: "/", icon: <MessagesSquare size={16} />, label: "Chat" },
    { path: "/tools", icon: <Wrench size={16} />, label: "Tools" },
    { path: "/models", icon: <Box size={16} />, label: "Models" },
    { path: "/settings", icon: <Settings2 size={16} />, label: "Settings" },
  ];

  const location = useLocation();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
      <div className="bg-background inline-flex w-fit justify-center border border-gray-300 p-2 text-gray-900 rounded-xl">
        <nav className="flex flex-row gap-1">
          {navItems.map(({ path, icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`p-2 hover:bg-muted rounded-lg cursor-pointer text-xs flex items-center space-x-2 ${
                location.pathname === path
                  ? "bg-muted  border-main-200 text-main-900"
                  : ""
              }`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
