import { RiExpandUpDownFill } from "react-icons/ri";
import { IoSearchOutline } from "react-icons/io5";
import { VscSettings } from "react-icons/vsc";

interface TitleBarProps {
  title?: string;
}

export default function TitleBar(props: TitleBarProps) {
  const { title } = props;
  const handleClose = () => window.electron.closeWindow();
  const handleMinimize = () => window.electron.minimizeWindow();
  const handleMaximize = () => window.electron.maximizeWindow();

  // Add your custom button handlers
  //   const handleSettings = () => {
  //   };

  const handleSearch = () => {};

  return (
    <div className="h-8 bg-gray-800 flex justify-between items-center select-none dragable">
      <div
        className="flex items-center gap-2 px-3 no-drag group" // Added group class
      >
        <button
          onClick={handleClose}
          className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 text-gray-900 flex items-center justify-center text-xs no-drag"
          title="Close"
        >
          <span className="opacity-0 text-[9px] group-hover:opacity-100">
            ✕
          </span>
        </button>
        <button
          onClick={handleMinimize}
          className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center text-gray-900 text-xs no-drag"
          title="Minimize"
        >
          <span className="opacity-0 group-hover:opacity-100">−</span>
        </button>
        <button
          onClick={handleMaximize}
          className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-gray-900 text-xs no-drag"
          title="Maximize"
        >
          <span className="opacity-0 group-hover:opacity-100 -rotate-45">
            <RiExpandUpDownFill />
          </span>
        </button>
      </div>
      <div className="absolute left-1/2 transform -translate-x-1/2 text-white">
        {title}
      </div>

      <div className="flex gap-2 px-3 no-drag">
        {/* <button
          onClick={handleSettings}
          className="px-2 text-white"
          title="Settings"
        >
          <VscSettings />
        </button> */}
        <button
          onClick={handleSearch}
          className="px-2 text-white"
          title="Notifications"
        >
          <IoSearchOutline />
        </button>
      </div>
    </div>
  );
}
