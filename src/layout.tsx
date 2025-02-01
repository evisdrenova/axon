import { ReactNode, useState } from "react";
import TitleBar from "./../components/Titlebar/Titlebar";
import NavBar from "./../components/NavBar/NavBar";

interface Props {
  children: ReactNode;
}

export default function Layout(props: Props) {
  const { children } = props;

  return (
    <div className="flex flex-col w-full h-screen">
      <TitleBar />
      <div className="flex flex-col w-full h-screen">
        <div className="flex-1 w-full h-full">
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
