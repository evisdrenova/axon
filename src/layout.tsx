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
    <div className="flex flex-col w-full h-screen">
      <TitleBar />
      <div className="flex flex-col w-full h-screen">
        {/* <NavBar isOpen={isOpen} setIsOpen={setIsOpen} /> */}
        <div className="flex-1 w-full h-full">
          <main>{children}</main>
        </div>
        <NavBar isOpen={isOpen} setIsOpen={setIsOpen} />
      </div>
    </div>
  );
}
