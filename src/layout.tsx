import { ReactNode } from "react";
import TitleBar from "./../components/Titlebar/Titlebar";
import { Toaster } from "sonner";

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
          <Toaster richColors closeButton />
        </div>
      </div>
    </div>
  );
}
