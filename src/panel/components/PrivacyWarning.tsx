import { useState } from "react";
import { AlertTriangle, Shield, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { useSettingsStore } from "@/stores/settings";
import { useRequestsStore } from "@/stores/requests";
import { sanitizeRequests, DEFAULT_SANITIZATION_RULES } from "@/lib/sanitizer";
import { buildContext } from "@/lib/llm";

export function PrivacyWarning() {
  const isPrivacyWarningOpen = useUIStore((s) => s.isPrivacyWarningOpen);
  const closePrivacyWarning = useUIStore((s) => s.closePrivacyWarning);
  const acceptPrivacyWarning = useSettingsStore((s) => s.acceptPrivacyWarning);
  const sanitizationRules = useSettingsStore((s) => s.sanitizationRules);
  const getSelectedRequests = useRequestsStore((s) => s.getSelectedRequests);

  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  if (!isPrivacyWarningOpen) return null;

  const handleAccept = () => {
    acceptPrivacyWarning();
    closePrivacyWarning();
  };

  const handleCancel = () => {
    closePrivacyWarning();
  };

  const handleShowPreview = () => {
    if (!showPreview) {
      // Generate preview
      const selectedRequests = getSelectedRequests();
      const rules = sanitizationRules.length > 0 ? sanitizationRules : DEFAULT_SANITIZATION_RULES;
      const sanitized = sanitizeRequests(selectedRequests, rules);
      const context = buildContext(sanitized);
      setPreviewContent(context);
    }
    setShowPreview(!showPreview);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-800">Privacy Notice</h2>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Main warning */}
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                <strong>Request data will be sent to an external LLM provider</strong> (Claude, OpenAI, or Ollama) for analysis.
              </p>
            </div>

            {/* What happens */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                What happens when you send a message:
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>
                    <strong>Sanitization:</strong> Sensitive data (API keys, tokens, passwords) is automatically redacted before sending
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Eye className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <span>
                    <strong>Data sent:</strong> Request URLs, headers, bodies, and timing information of selected requests
                  </span>
                </li>
              </ul>
            </div>

            {/* What's protected */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Automatically redacted:
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Bearer tokens",
                  "JWT tokens",
                  "API keys",
                  "Passwords",
                  "Cookies",
                  "Session IDs",
                  "Credit cards",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Preview button */}
            <button
              type="button"
              onClick={handleShowPreview}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <span>Preview what will be sent</span>
              {showPreview ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {/* Preview content */}
            {showPreview && previewContent && (
              <div className="max-h-60 overflow-auto rounded-lg bg-gray-900 p-3">
                <pre className="whitespace-pre-wrap text-xs text-gray-300">
                  {previewContent}
                </pre>
              </div>
            )}

            {/* Note */}
            <p className="text-xs text-gray-500">
              This warning is shown once per session. You can configure additional sanitization rules in Settings.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            I Understand, Continue
          </button>
        </div>
      </div>
    </div>
  );
}
