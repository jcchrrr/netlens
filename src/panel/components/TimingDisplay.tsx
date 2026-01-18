import type { RequestTiming } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TimingDisplayProps {
  timing: RequestTiming;
  duration: number;
}

interface TimingPhase {
  key: keyof RequestTiming;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const TIMING_PHASES: TimingPhase[] = [
  {
    key: "blocked",
    label: "Blocked",
    description: "Time spent in queue waiting for a network connection",
    color: "bg-gray-500",
    bgColor: "bg-gray-100",
  },
  {
    key: "dns",
    label: "DNS Lookup",
    description: "Time spent performing the DNS lookup",
    color: "bg-cyan-500",
    bgColor: "bg-cyan-50",
  },
  {
    key: "connect",
    label: "Connecting",
    description: "Time spent establishing a TCP connection",
    color: "bg-orange-500",
    bgColor: "bg-orange-50",
  },
  {
    key: "ssl",
    label: "TLS/SSL",
    description: "Time spent completing a TLS handshake",
    color: "bg-purple-500",
    bgColor: "bg-purple-50",
  },
  {
    key: "send",
    label: "Sending",
    description: "Time spent sending the request",
    color: "bg-green-500",
    bgColor: "bg-green-50",
  },
  {
    key: "wait",
    label: "Waiting (TTFB)",
    description: "Time spent waiting for the initial response",
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    key: "receive",
    label: "Receiving",
    description: "Time spent receiving the response",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
  },
];

export function TimingDisplay({ timing, duration }: TimingDisplayProps) {
  // Calculate total from individual phases (might differ from duration due to overlaps)
  const calculatedTotal = Object.values(timing).reduce(
    (sum, val) => sum + Math.max(0, val),
    0
  );
  const displayTotal = Math.max(duration, calculatedTotal);

  // Filter phases that have actual time (> 0)
  const activePhases = TIMING_PHASES.filter((phase) => timing[phase.key] > 0);

  return (
    <div className="space-y-6 p-4">
      {/* Visual waterfall */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-700">
          Request Timing
        </h3>
        <div className="space-y-1.5">
          {TIMING_PHASES.map((phase) => {
            const value = timing[phase.key];
            if (value <= 0) return null;

            const percentage =
              displayTotal > 0 ? (value / displayTotal) * 100 : 0;
            const startOffset = calculateStartOffset(timing, phase.key);
            const offsetPercentage =
              displayTotal > 0 ? (startOffset / displayTotal) * 100 : 0;

            return (
              <div key={phase.key} className="flex items-center gap-2">
                <div className="w-24 text-xs text-gray-600">{phase.label}</div>
                <div className="relative h-4 flex-1 rounded bg-gray-100">
                  <div
                    className={cn("absolute h-full rounded", phase.color)}
                    style={{
                      left: `${offsetPercentage}%`,
                      width: `${Math.max(percentage, 1)}%`,
                    }}
                  />
                </div>
                <div className="w-16 text-right font-mono text-xs text-gray-600">
                  {formatTiming(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total duration */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <span className="text-sm font-medium text-gray-700">Total Duration</span>
        <span className="font-mono text-sm font-medium text-gray-900">
          {formatTiming(duration)}
        </span>
      </div>

      {/* Detailed breakdown */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-700">
          Detailed Breakdown
        </h3>
        <div className="space-y-2">
          {activePhases.map((phase) => (
            <TimingRow
              key={phase.key}
              phase={phase}
              value={timing[phase.key]}
              total={displayTotal}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="mb-2 text-xs font-medium text-gray-500">Legend</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {TIMING_PHASES.map((phase) => (
            <div key={phase.key} className="flex items-center gap-1.5">
              <div className={cn("h-2 w-2 rounded-full", phase.color)} />
              <span className="text-xs text-gray-600">{phase.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TimingRowProps {
  phase: TimingPhase;
  value: number;
  total: number;
}

function TimingRow({ phase, value, total }: TimingRowProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className={cn("rounded-lg p-2", phase.bgColor)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", phase.color)} />
          <span className="text-xs font-medium text-gray-700">
            {phase.label}
          </span>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs font-medium text-gray-900">
            {formatTiming(value)}
          </span>
          <span className="ml-1.5 text-xs text-gray-500">
            ({percentage.toFixed(1)}%)
          </span>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">{phase.description}</p>
    </div>
  );
}

// Helper functions

function calculateStartOffset(
  timing: RequestTiming,
  key: keyof RequestTiming
): number {
  const order: (keyof RequestTiming)[] = [
    "blocked",
    "dns",
    "connect",
    "ssl",
    "send",
    "wait",
    "receive",
  ];
  let offset = 0;
  for (const phase of order) {
    if (phase === key) break;
    offset += Math.max(0, timing[phase]);
  }
  return offset;
}

function formatTiming(ms: number): string {
  if (ms < 0) return "—";
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}
