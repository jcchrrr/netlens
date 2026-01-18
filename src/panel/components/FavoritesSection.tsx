import { ChevronDown, ChevronRight, Star } from "lucide-react";
import { useRequestsStore } from "@/stores/requests";
import { useUIStore } from "@/stores/ui";
import { RequestItem } from "./RequestItem";

export function FavoritesSection() {
  const getFavoriteRequests = useRequestsStore((s) => s.getFavoriteRequests);
  const isFavoritesExpanded = useUIStore((s) => s.isFavoritesExpanded);
  const toggleFavoritesExpanded = useUIStore((s) => s.toggleFavoritesExpanded);

  const favoriteRequests = getFavoriteRequests();

  if (favoriteRequests.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-200">
      {/* Header */}
      <button
        type="button"
        onClick={toggleFavoritesExpanded}
        className="flex w-full items-center gap-2 bg-yellow-50/50 px-3 py-2 text-left hover:bg-yellow-50"
      >
        {isFavoritesExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
        <span className="text-sm font-medium text-gray-700">Favorites</span>
        <span className="text-xs text-gray-500">({favoriteRequests.length})</span>
      </button>

      {/* Content */}
      {isFavoritesExpanded && (
        <div className="bg-yellow-50/30">
          {favoriteRequests.map((request) => (
            <RequestItem key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
