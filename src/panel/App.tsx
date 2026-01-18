import { useEffect } from "react";
import { useNetworkCapture } from "@/lib/network";
import { useSettingsStore } from "@/stores/settings";
import { useChatStore } from "@/stores/chat";
import { useUIStore } from "@/stores/ui";
import { Toolbar } from "./components/Toolbar";
import { RequestList } from "./components/RequestList";
import { ChatPanel } from "./components/ChatPanel";
import { RequestDrawer } from "./components/RequestDrawer";
import { SettingsModal } from "./components/SettingsModal";
import { PrivacyWarning } from "./components/PrivacyWarning";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadChatFromSession = useChatStore((s) => s.loadFromSession);
  const isNarrowLayout = useUIStore((s) => s.isNarrowLayout);
  const setNarrowLayout = useUIStore((s) => s.setNarrowLayout);

  // Start network capture
  useNetworkCapture();

  // Load settings and chat history on mount
  useEffect(() => {
    loadSettings();
    loadChatFromSession();
  }, [loadSettings, loadChatFromSession]);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setNarrowLayout(window.innerWidth < 400);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setNarrowLayout]);

  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col bg-white">
        {/* Toolbar */}
        <Toolbar />

        {/* Main content area */}
        <main
          className={`flex flex-1 overflow-hidden ${
            isNarrowLayout ? "flex-col" : "flex-row"
          }`}
        >
          {/* Request list panel */}
          <div
            className={`flex flex-col border-gray-200 ${
              isNarrowLayout ? "h-1/2 border-b" : "w-1/2 border-r"
            }`}
          >
            <ErrorBoundary>
              <RequestList />
            </ErrorBoundary>
          </div>

          {/* Chat panel */}
          <div className={`flex flex-col ${isNarrowLayout ? "h-1/2" : "w-1/2"}`}>
            <ErrorBoundary>
              <ChatPanel />
            </ErrorBoundary>
          </div>
        </main>

        {/* Request detail drawer */}
        <RequestDrawer />

        {/* Modals */}
        <SettingsModal />
        <PrivacyWarning />
      </div>
    </ErrorBoundary>
  );
}
