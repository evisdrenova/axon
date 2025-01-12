import { Button } from "../../components/ui/button";
import { Box, ChevronLeft, ChevronRight, Home, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export default function NavBar(props: Props) {
  const navItems = [
    { path: "/", icon: <Home size={16} />, label: "Home" },
    { path: "/tools", icon: <Wrench size={16} />, label: "Tools" },
    { path: "/model", icon: <Box size={16} />, label: "Models" },
  ];

  const { isOpen, setIsOpen } = props;
  return (
    <div
      className={`bg-background border-r border-r-gray-300 px-4 text-gray-900 transition-all duration-300 h-full ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="flex items-center justify-end mt-6">
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="hover:bg-muted p-2 rounded-xl"
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </Button>
      </div>
      <nav className="mt-4 flex flex-col gap-1">
        {navItems.map(({ path, icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`p-2 hover:bg-muted rounded-xl  cursor-pointer text-xs flex items-center ${
              location.pathname === path
                ? "bg-muted border border-main-200 text-main-900"
                : ""
            }`}
          >
            {icon}
            {isOpen && <span className="ml-2">{label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
