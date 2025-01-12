import { Box, Home, MessagesSquare, Settings2, Wrench } from "lucide-react";
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
                  ? "bg-muted border border-main-200 text-main-900"
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
    // <div
    //   className={`bg-background border-r border-r-gray-300 px-4 text-gray-900 transition-all duration-300 h-full ${
    //     isOpen ? "w-64" : "w-16"
    //   }`}
    // >
    //   <div className="flex items-center justify-end mt-6">
    //     <Button
    //       variant="ghost"
    //       onClick={() => setIsOpen(!isOpen)}
    //       className="hover:bg-muted p-2 rounded-xl"
    //     >
    //       {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    //     </Button>
    //   </div>
    //   <nav className="mt-4 flex flex-row gap-1">
    //     {navItems.map(({ path, icon, label }) => (
    //       <Link
    //         key={path}
    //         to={path}
    //         className={`p-2 hover:bg-muted rounded-xl  cursor-pointer text-xs flex items-center ${
    //           location.pathname === path
    //             ? "bg-muted border border-main-200 text-main-900"
    //             : ""
    //         }`}
    //       >
    //         {icon}
    //         {isOpen && <span className="ml-2">{label}</span>}
    //       </Link>
    //     ))}
    //   </nav>
    // </div>
  );
}
