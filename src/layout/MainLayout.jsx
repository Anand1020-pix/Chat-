import React, { useState, useEffect } from "react";
import { useRoutes } from "react-router-dom";
import RouteConfig from "../routes/RouteConfig.jsx";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/TopBar.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { ConversationProvider } from "../context/ConversationContext.jsx";

const MainLayout = () => {
  const routes = useRoutes(RouteConfig);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    // If the page is already loaded, hide immediately
    if (document.readyState === "complete") {
      setAppLoading(false);
      return;
    }

    const onLoad = () => setAppLoading(false);
    // Fallback in case load never fires in dev: hide after 8s
    const fallback = setTimeout(() => setAppLoading(false), 8000);

    window.addEventListener("load", onLoad);
    return () => {
      clearTimeout(fallback);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <ConversationProvider>
    <div className="flex h-screen overflow-hidden  bg-gray-900 dark:bg-dark-main-bg text-black dark:text-white">
      {appLoading && <LoadingScreen title="Chat" />}
      <div className="hidden md:block">
        <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} overlayWhenCollapsed={true} />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
  <TopBar
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          toggleExpand={() => setSidebarExpanded((s) => !s)}
          sidebarExpanded={sidebarExpanded}
        />
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