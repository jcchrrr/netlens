import type { CaptureScope, NetworkRequest } from "@/lib/utils/types";
import { parseHarEntry, matchesExclusionPattern } from "./parser";

export interface CaptureOptions {
  scope: CaptureScope;
  exclusionPatterns: string[];
  onRequest: (request: NetworkRequest) => void;
  onError?: (error: Error) => void;
}

/**
 * Get the current page URL from the inspected window
 */
async function getInspectedPageUrl(): Promise<string> {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval("window.location.href", (result) => {
      resolve(typeof result === "string" ? result : "");
    });
  });
}

/**
 * Get the origin of a URL
 */
function getOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

/**
 * Check if a request should be captured based on scope
 */
async function shouldCaptureRequest(
  request: chrome.devtools.network.Request,
  scope: CaptureScope,
  pageUrl: string
): Promise<boolean> {
  const requestUrl = request.request.url;
  const pageOrigin = getOrigin(pageUrl);
  const requestOrigin = getOrigin(requestUrl);

  switch (scope) {
    case "page":
      // Only capture requests from the main page origin
      // This is a simplified check - in practice, we'd need to check initiator
      return requestOrigin === pageOrigin;

    case "page-iframes":
      // Capture main page and same-origin iframes
      // For now, we'll be permissive and capture same-origin requests
      return requestOrigin === pageOrigin;

    case "all":
      // Capture everything
      return true;

    default:
      return true;
  }
}

/**
 * Start capturing network requests
 * Returns a cleanup function to stop capturing
 */
export function startCapture(options: CaptureOptions): () => void {
  const { scope, exclusionPatterns, onRequest, onError } = options;

  let isCapturing = true;
  let pageUrl = "";

  // Get initial page URL
  getInspectedPageUrl().then((url) => {
    pageUrl = url;
  });

  // Handle request finished event
  const handleRequestFinished = async (
    request: chrome.devtools.network.Request
  ) => {
    if (!isCapturing) return;

    try {
      const requestUrl = request.request.url;

      // Check exclusion patterns
      if (matchesExclusionPattern(requestUrl, exclusionPatterns)) {
        return;
      }

      // Check scope (if we have page URL)
      if (pageUrl) {
        const shouldCapture = await shouldCaptureRequest(request, scope, pageUrl);
        if (!shouldCapture) {
          return;
        }
      }

      // Parse the HAR entry
      const networkRequest = await parseHarEntry(request);

      // Call the callback
      onRequest(networkRequest);
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      }
      console.error("Error processing request:", error);
    }
  };

  // Listen to navigation to update page URL
  const handleNavigation = (url: string) => {
    pageUrl = url;
  };

  // Add listeners
  chrome.devtools.network.onRequestFinished.addListener(handleRequestFinished);
  chrome.devtools.network.onNavigated.addListener(handleNavigation);

  // Return cleanup function
  return () => {
    isCapturing = false;
    chrome.devtools.network.onRequestFinished.removeListener(handleRequestFinished);
    chrome.devtools.network.onNavigated.removeListener(handleNavigation);
  };
}

/**
 * Get all requests that have already been captured in the current session
 * Useful for getting requests that happened before the panel was opened
 */
export async function getExistingRequests(
  options: Pick<CaptureOptions, "scope" | "exclusionPatterns">
): Promise<NetworkRequest[]> {
  const { scope, exclusionPatterns } = options;

  return new Promise((resolve) => {
    chrome.devtools.network.getHAR(async (harLog) => {
      const requests: NetworkRequest[] = [];
      const pageUrl = await getInspectedPageUrl();

      for (const entry of harLog.entries) {
        try {
          const requestUrl = entry.request.url;

          // Check exclusion patterns
          if (matchesExclusionPattern(requestUrl, exclusionPatterns)) {
            continue;
          }

          // Check scope
          if (pageUrl) {
            const shouldCapture = await shouldCaptureRequest(
              entry as unknown as chrome.devtools.network.Request,
              scope,
              pageUrl
            );
            if (!shouldCapture) {
              continue;
            }
          }

          // Parse the entry (note: getContent won't work on HAR entries)
          const networkRequest = await parseHarEntry(
            entry as unknown as chrome.devtools.network.Request
          );
          requests.push(networkRequest);
        } catch (error) {
          console.error("Error processing HAR entry:", error);
        }
      }

      resolve(requests);
    });
  });
}

/**
 * Clear the network log in DevTools
 */
export function clearNetworkLog(): void {
  // Note: There's no direct API to clear the network log
  // The user needs to do this manually or we can suggest it
  console.log("Network log can be cleared from the Network panel");
}
