import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useRequestsStore } from "@/stores/requests";

export function SearchBar() {
  const searchQuery = useRequestsStore((s) => s.searchQuery);
  const setSearchQuery = useRequestsStore((s) => s.setSearchQuery);

  // Local state for debouncing
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounce search query updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 150);

    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  // Sync local state when external state changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleClear = () => {
    setLocalQuery("");
    setSearchQuery("");
  };

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder="Search requests..."
        className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-8 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {localQuery && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
