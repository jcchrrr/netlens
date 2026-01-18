import { Wifi } from "lucide-react";
import { useRequestsStore } from "@/stores/requests";
import { SearchBar } from "./SearchBar";
import { FavoritesSection } from "./FavoritesSection";
import { RequestItem } from "./RequestItem";

export function RequestList() {
  const requests = useRequestsStore((s) => s.requests);
  const getFilteredRequests = useRequestsStore((s) => s.getFilteredRequests);
  const favorites = useRequestsStore((s) => s.favorites);
  const selected = useRequestsStore((s) => s.selected);
  const selectAll = useRequestsStore((s) => s.selectAll);
  const deselectAll = useRequestsStore((s) => s.deselectAll);

  const filteredRequests = getFilteredRequests();

  // Filter out favorites from the main list (they're shown in FavoritesSection)
  const nonFavoriteRequests = filteredRequests.filter((r) => !favorites.has(r.id));

  // Calculate selection state
  const visibleIds = filteredRequests.map((r) => r.id);
  const selectedVisible = visibleIds.filter((id) => selected.has(id));
  const allVisibleSelected =
    visibleIds.length > 0 && selectedVisible.length === visibleIds.length;
  const someVisibleSelected =
    selectedVisible.length > 0 && selectedVisible.length < visibleIds.length;

  const handleSelectAllChange = () => {
    if (allVisibleSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header with search and select all */}
      <div className="shrink-0 border-b border-gray-200 p-3">
        <SearchBar />

        {/* Select all row */}
        {filteredRequests.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              ref={(el) => {
                if (el) el.indeterminate = someVisibleSelected;
              }}
              onChange={handleSelectAllChange}
              className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500">
              {selected.size > 0
                ? `${selected.size} selected`
                : `${filteredRequests.length} requests`}
            </span>
          </div>
        )}
      </div>

      {/* Request list */}
      <div className="flex-1 overflow-y-auto">
        {requests.length === 0 ? (
          // Empty state
          <div className="flex h-full flex-col items-center justify-center p-8 text-gray-400">
            <Wifi className="mb-3 h-12 w-12 stroke-1" />
            <p className="text-sm font-medium">No requests captured yet</p>
            <p className="mt-1 text-xs">Network requests will appear here</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          // No results state
          <div className="flex h-full flex-col items-center justify-center p-8 text-gray-400">
            <p className="text-sm">No matching requests</p>
            <p className="mt-1 text-xs">Try adjusting your search</p>
          </div>
        ) : (
          <>
            {/* Favorites section */}
            <FavoritesSection />

            {/* Main request list (non-favorites) */}
            <div>
              {nonFavoriteRequests.map((request) => (
                <RequestItem key={request.id} request={request} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
