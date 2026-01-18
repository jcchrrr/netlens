import { useState, useEffect, useCallback } from "react";
import { X, ExternalLink, RefreshCw, Edit3 } from "lucide-react";
import { useRequestsStore } from "@/stores/requests";
import { useUIStore } from "@/stores/ui";
import { cn, formatDuration, formatBytes, formatTime } from "@/lib/utils";
import { HeadersDisplay } from "./HeadersDisplay";
import { BodyDisplay } from "./BodyDisplay";
import { TimingDisplay } from "./TimingDisplay";
import { ReplayEditor } from "./ReplayEditor";

export function RequestDrawer() {
  const [isEditMode, setIsEditMode] = useState(false);

  const activeRequestId = useUIStore((s) => s.activeRequestId);
  const isDrawerOpen = useUIStore((s) => s.isDrawerOpen);
  const drawerTab = useUIStore((s) => s.drawerTab);
  const closeDrawer = useUIStore((s) => s.closeDrawer);
  const setDrawerTab = useUIStore((s) => s.setDrawerTab);

  const requests = useRequestsStore((s) => s.requests);
  const request = requests.find((r) => r.id === activeRequestId);

  // Reset edit mode when drawer closes or request changes
  useEffect(() => {
    setIsEditMode(false);
  }, [activeRequestId, isDrawerOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        if (isEditMode) {
          setIsEditMode(false);
        } else {
          closeDrawer();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, isEditMode, closeDrawer]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        if (isEditMode) {
          setIsEditMode(false);
        } else {
          closeDrawer();
        }
      }
    },
    [isEditMode, closeDrawer]
  );

  const handleReplay = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setIsEditMode(false);
  }, []);

  const handleOpenInNewTab = useCallback(() => {
    if (request) {
      window.open(request.url, "_blank");
    }
  }, [request]);

  if (!isDrawerOpen || !request) {
    return null;
  }

  const methodColor = getMethodColor(request.method);
  const statusColor = getStatusColor(request.status);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/20"
      onClick={handleBackdropClick}
    >
      {/* Drawer panel */}
      <div className="absolute bottom-0 right-0 top-0 flex w-[400px] flex-col bg-white shadow-xl">
        {isEditMode ? (
          // Edit/Replay mode
          <ReplayEditor request={request} onClose={handleCloseEditor} />
        ) : (
          // Normal view mode
          <>
            {/* Header */}
            <div className="shrink-0 border-b border-gray-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {/* Method and URL */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
                        methodColor
                      )}
                    >
                      {request.method}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
                        statusColor
                      )}
                    >
                      {request.status}
                    </span>
                    {request.isGraphQL && (
                      <span className="shrink-0 rounded bg-pink-100 px-1.5 py-0.5 text-xs font-medium text-pink-700">
                        GraphQL
                      </span>
                    )}
                    {request.isReplayed && (
                      <span className="shrink-0 rounded bg-cyan-100 px-1.5 py-0.5 text-xs font-medium text-cyan-700">
                        <RefreshCw className="mr-0.5 inline h-3 w-3" />
                        Replay
                      </span>
                    )}
                  </div>
                  {/* URL */}
                  <p className="mt-1.5 break-all text-xs text-gray-600" title={request.url}>
                    {request.url}
                  </p>
                  {/* Meta info */}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                    <span>{formatTime(request.timestamp)}</span>
                    <span>{formatDuration(request.duration)}</span>
                    <span>{formatBytes(request.responseBodySize)}</span>
                  </div>
                </div>
                {/* Close button */}
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleReplay}
                  className="flex items-center gap-1.5 rounded bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit & Replay
                </button>
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="flex items-center gap-1.5 rounded bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open URL
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="shrink-0 border-b border-gray-200">
              <div className="flex">
                <TabButton
                  active={drawerTab === "request"}
                  onClick={() => setDrawerTab("request")}
                >
                  Request
                </TabButton>
                <TabButton
                  active={drawerTab === "response"}
                  onClick={() => setDrawerTab("response")}
                >
                  Response
                </TabButton>
                <TabButton
                  active={drawerTab === "timing"}
                  onClick={() => setDrawerTab("timing")}
                >
                  Timing
                </TabButton>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {drawerTab === "request" && (
                <RequestTab
                  headers={request.requestHeaders}
                  body={request.requestBody}
                  bodySize={request.requestBodySize}
                />
              )}
              {drawerTab === "response" && (
                <ResponseTab
                  headers={request.responseHeaders}
                  body={request.responseBody}
                  bodySize={request.responseBodySize}
                  mimeType={request.responseMimeType}
                  hasFullBody={request.hasFullResponseBody}
                  getFullBody={request.getFullResponseBody}
                />
              )}
              {drawerTab === "timing" && (
                <TimingDisplay timing={request.timing} duration={request.duration} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-blue-500 text-blue-600"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
      )}
    >
      {children}
    </button>
  );
}

interface RequestTabProps {
  headers: Record<string, string>;
  body: string | null;
  bodySize: number;
}

function RequestTab({ headers, body, bodySize }: RequestTabProps) {
  return (
    <div>
      <Section title="Headers">
        <HeadersDisplay headers={headers} type="request" />
      </Section>
      <Section title="Body">
        <BodyDisplay
          body={body}
          bodySize={bodySize}
          mimeType={headers["content-type"] || headers["Content-Type"] || ""}
          hasFullBody={true}
        />
      </Section>
    </div>
  );
}

interface ResponseTabProps {
  headers: Record<string, string>;
  body: string | null;
  bodySize: number;
  mimeType: string;
  hasFullBody: boolean;
  getFullBody?: () => Promise<string>;
}

function ResponseTab({
  headers,
  body,
  bodySize,
  mimeType,
  hasFullBody,
  getFullBody,
}: ResponseTabProps) {
  return (
    <div>
      <Section title="Headers">
        <HeadersDisplay headers={headers} type="response" />
      </Section>
      <Section title="Body">
        <BodyDisplay
          body={body}
          bodySize={bodySize}
          mimeType={mimeType}
          hasFullBody={hasFullBody}
          getFullBody={getFullBody}
        />
      </Section>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <h3 className="bg-gray-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <div className="px-3">{children}</div>
    </div>
  );
}

// Color helpers

function getMethodColor(method: string): string {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-green-100 text-green-700";
    case "POST":
      return "bg-blue-100 text-blue-700";
    case "PUT":
      return "bg-amber-100 text-amber-700";
    case "PATCH":
      return "bg-orange-100 text-orange-700";
    case "DELETE":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusColor(status: number): string {
  if (status >= 500) return "bg-red-100 text-red-700";
  if (status >= 400) return "bg-orange-100 text-orange-700";
  if (status >= 300) return "bg-yellow-100 text-yellow-700";
  if (status >= 200) return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}
