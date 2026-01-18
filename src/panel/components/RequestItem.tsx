import { Star, RefreshCw } from "lucide-react";
import { useRequestsStore } from "@/stores/requests";
import { useUIStore } from "@/stores/ui";
import {
  cn,
  formatBytes,
  formatDuration,
  getMethodColor,
  getStatusColor,
  isErrorStatus,
  getUrlPath,
} from "@/lib/utils";
import type { NetworkRequest } from "@/lib/utils/types";

interface RequestItemProps {
  request: NetworkRequest;
  showCheckbox?: boolean;
}

export function RequestItem({ request, showCheckbox = true }: RequestItemProps) {
  const selected = useRequestsStore((s) => s.selected);
  const favorites = useRequestsStore((s) => s.favorites);
  const toggleSelected = useRequestsStore((s) => s.toggleSelected);
  const toggleFavorite = useRequestsStore((s) => s.toggleFavorite);

  const activeRequestId = useUIStore((s) => s.activeRequestId);
  const openDrawer = useUIStore((s) => s.openDrawer);

  const isSelected = selected.has(request.id);
  const isFavorite = favorites.has(request.id);
  const isActive = activeRequestId === request.id;
  const isError = isErrorStatus(request.status);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    toggleSelected(request.id);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(request.id);
  };

  const handleRowClick = () => {
    openDrawer(request.id);
  };

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        "group flex cursor-pointer flex-col border-b border-gray-100 px-3 py-2 transition-colors",
        isActive && "bg-blue-50",
        !isActive && "hover:bg-gray-50",
        isError && !isActive && "bg-red-50/50"
      )}
    >
      {/* Line 1: Checkbox, Method, URL, Favorite */}
      <div className="flex items-center gap-2">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            className="h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        )}

        {/* Method badge */}
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
            getMethodColor(request.method)
          )}
        >
          {request.method}
        </span>

        {/* URL */}
        <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
          {getUrlPath(request.url)}
        </span>

        {/* Favorite star */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={cn(
            "shrink-0 rounded p-0.5 transition-colors",
            isFavorite
              ? "text-yellow-500 hover:text-yellow-600"
              : "text-gray-300 hover:text-gray-400 opacity-0 group-hover:opacity-100"
          )}
        >
          <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
        </button>
      </div>

      {/* Line 2: Status, Size, Time, Tags */}
      <div className="mt-1 flex items-center gap-2 pl-5">
        {showCheckbox && <div className="w-3.5" />}

        {/* Status */}
        <span
          className={cn("text-xs font-medium", getStatusColor(request.status))}
        >
          {request.status}
        </span>

        {/* Size */}
        <span className="text-xs text-gray-500">
          {formatBytes(request.responseBodySize)}
        </span>

        {/* Duration */}
        <span className="text-xs text-gray-500">
          {formatDuration(request.duration)}
        </span>

        {/* Tags */}
        <div className="flex items-center gap-1">
          {request.isGraphQL && (
            <span className="rounded bg-purple-100 px-1 py-0.5 text-[10px] font-medium text-purple-700">
              GraphQL
            </span>
          )}
          {request.isWebSocket && (
            <span className="rounded bg-green-100 px-1 py-0.5 text-[10px] font-medium text-green-700">
              WS
            </span>
          )}
          {request.isReplayed && (
            <span className="flex items-center gap-0.5 rounded bg-blue-100 px-1 py-0.5 text-[10px] font-medium text-blue-700">
              <RefreshCw className="h-2.5 w-2.5" />
              Replay
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
