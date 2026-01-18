import { useEffect, useRef } from "react";
import { useRequestsStore } from "@/stores/requests";
import { useSettingsStore } from "@/stores/settings";
import { startCapture, getExistingRequests } from "./capture";

/**
 * Hook to manage network capture lifecycle
 * Automatically starts/stops capture based on pause state
 * Syncs with settings for scope and exclusion patterns
 */
export function useNetworkCapture() {
  const addRequest = useRequestsStore((state) => state.addRequest);
  const isPaused = useRequestsStore((state) => state.isPaused);
  const captureScope = useSettingsStore((state) => state.captureScope);
  const exclusionPatterns = useSettingsStore((state) => state.exclusionPatterns);

  const cleanupRef = useRef<(() => void) | null>(null);
  const hasLoadedExisting = useRef(false);

  // Load existing requests on first mount
  useEffect(() => {
    if (hasLoadedExisting.current) return;
    hasLoadedExisting.current = true;

    // Load requests that were captured before the panel opened
    getExistingRequests({
      scope: captureScope,
      exclusionPatterns,
    })
      .then((requests) => {
        for (const request of requests) {
          addRequest(request);
        }
      })
      .catch((error) => {
        console.error("Failed to load existing requests:", error);
      });
  }, [addRequest, captureScope, exclusionPatterns]);

  // Start/stop capture based on pause state
  useEffect(() => {
    // Clean up previous capture if any
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Don't start if paused
    if (isPaused) {
      return;
    }

    // Start capturing
    cleanupRef.current = startCapture({
      scope: captureScope,
      exclusionPatterns,
      onRequest: addRequest,
      onError: (error) => {
        console.error("Capture error:", error);
      },
    });

    // Cleanup on unmount or when dependencies change
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [isPaused, captureScope, exclusionPatterns, addRequest]);
}
