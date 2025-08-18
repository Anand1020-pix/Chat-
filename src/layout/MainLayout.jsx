import React, { useState } from "react";
import { useRoutes } from "react-router-dom";
import RouteConfig from "../routes/RouteConfig.jsx";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/TopBar.jsx";
import { ConversationProvider } from "../context/ConversationContext.jsx";

const MainLayout = () => {
  const routes = useRoutes(RouteConfig);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ConversationProvider>
    <div className="flex h-screen overflow-hidden   dark:bg-dark-main-bg text-black dark:text-white">
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="flex-grow p-4 overflow-y-auto">{routes}</main>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden ${
          isSidebarOpen ? "block" : "hidden"
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      <div
        className={`fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar isMobile={true} closeSidebar={() => setSidebarOpen(false)} />
      </div>
    </div>
    </ConversationProvider>
  );
};

export default MainLayout;