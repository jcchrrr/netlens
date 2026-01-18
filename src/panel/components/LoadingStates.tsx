import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn("animate-spin text-blue-500", sizeClasses[size], className)}
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({ message, className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80",
        className
      )}
    >
      <LoadingSpinner size="lg" />
      {message && (
        <p className="mt-2 text-sm text-gray-500">{message}</p>
      )}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-gray-200",
        className
      )}
    />
  );
}

// Skeleton for request list items
export function RequestItemSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-3 py-2">
      {/* Method badge */}
      <Skeleton className="h-5 w-12 rounded" />
      {/* Status */}
      <Skeleton className="h-5 w-10 rounded" />
      {/* URL */}
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      {/* Duration */}
      <Skeleton className="h-4 w-12" />
      {/* Size */}
      <Skeleton className="h-4 w-14" />
    </div>
  );
}

export function RequestListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <RequestItemSkeleton key={i} />
      ))}
    </div>
  );
}

// Skeleton for drawer content
export function DrawerSkeleton() {
  return (
    <div className="p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-14" />
        <Skeleton className="h-6 w-10" />
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="ml-4 h-8 w-20" />
        <Skeleton className="ml-4 h-8 w-20" />
      </div>

      {/* Content */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-2/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for chat messages
export function ChatMessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn("flex gap-2", isUser && "justify-end")}>
      {!isUser && <Skeleton className="h-8 w-8 shrink-0 rounded-full" />}
      <div className={cn("max-w-[80%] space-y-2", isUser && "items-end")}>
        <Skeleton className={cn("h-4", isUser ? "w-32" : "w-48")} />
        <Skeleton className={cn("h-4", isUser ? "w-24" : "w-40")} />
        {!isUser && <Skeleton className="h-4 w-32" />}
      </div>
      {isUser && <Skeleton className="h-8 w-8 shrink-0 rounded-full" />}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <ChatMessageSkeleton isUser />
      <ChatMessageSkeleton />
      <ChatMessageSkeleton isUser />
      <ChatMessageSkeleton />
    </div>
  );
}

// Full page loading state
interface FullPageLoadingProps {
  message?: string;
}

export function FullPageLoading({ message = "Loading..." }: FullPageLoadingProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-gray-500">{message}</p>
    </div>
  );
}

// Empty state with optional loading
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  loading?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  loading,
}: EmptyStateProps) {
  if (loading) {
    return <FullPageLoading message={title} />;
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      {icon && (
        <div className="mb-4 text-gray-300">{icon}</div>
      )}
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
