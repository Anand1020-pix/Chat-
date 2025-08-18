import React from "react";
import { RiMenuFill } from "react-icons/ri";

const TopBar = ({ toggleSidebar }) => {
    return (
        <div className="w-full h-16 bg-gray-800 text-white flex items-center justify-between px-4">
            <button
                className="md:hidden text-2xl"
                onClick={toggleSidebar}
            >
                <RiMenuFill />
            </button>
            <h1 className="text-xl font-bold">Chat</h1>
        </div>
    );
}
export default TopBar;