import React from "react";
import { RiMenuFill, RiMenuFold2Fill } from "react-icons/ri";

const TopBar = ({ toggleSidebar, toggleExpand, sidebarExpanded }) => {
    return (
        <div className="w-full h-16 bg-gray-800 text-white flex items-center justify-between px-4">
            <div className="flex items-center">
                <button
                    className="md:hidden text-2xl mr-3"
                    onClick={toggleSidebar}
                >
                    <RiMenuFill />
                </button>

                <h1 className="text-xl font-bold">Chat</h1>
            </div>
        </div>
    );
}
export default TopBar;