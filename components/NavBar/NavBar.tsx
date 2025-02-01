import { Box, MessagesSquare, Settings2, Wrench } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function NavBar() {
  const navItems = [
    { path: "/tools", icon: <Wrench size={16} />, label: "Tools" },
    { path: "/models", icon: <Box size={16} />, label: "Models" },
  ];

  const location = useLocation();

  return (
    <div className="bg-background inline-flex w-fit justify-center p-2 text-gray-900 ">
      <nav className="flex flex-col gap-1 w-full">
        {navItems.map(({ path, icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`p-2 hover:bg-muted rounded-lg cursor-pointer text-xs flex items-center space-x-2 w-full ${
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
  );
}
