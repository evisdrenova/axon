import { ReactNode, useState } from "react";
import TitleBar from "./../components/Titlebar/Titlebar";
import NavBar from "./../components/NavBar/NavBar";

interface Props {
  children: ReactNode;
}

export default function Layout(props: Props) {
  const { children } = props;
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen">
      <TitleBar />
      <div className="flex flex-row items-center w-full h-screen">
        <NavBar isOpen={isOpen} setIsOpen={setIsOpen} />
        <div className="flex-1 overflow-auto bg-gray-100 h-full">
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
