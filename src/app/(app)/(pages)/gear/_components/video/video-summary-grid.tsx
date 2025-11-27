import { cn } from "~/lib/utils";

type ParsedSummaryLine =
  | {
      raw: string;
      structured: true;
      resolution: string;
      fps: string;
      bitDepth: string;
    }
  | {
      raw: string;
      structured: false;
    };

function parseLines(lines: string[]): ParsedSummaryLine[] {
  return lines.map((line) => {
    const match = line.match(
      /^(.*?)\s+–\s+up to\s+(\d+)\s+fps\s+–\s+(\d+)-bit$/i,
    );
    if (!match) {
      return { raw: line, structured: false as const };
    }
    const resolution = match[1]?.trim() ?? line;
    const fps = match[2] ?? "";
    const bitDepth = match[3] ?? "";
    return {
      raw: line,
      structured: true as const,
      resolution,
      fps,
      bitDepth,
    };
  });
}

type VideoSummaryGridProps = {
  lines: string[];
  className?: string;
  structuredClassName?: string;
  plainClassName?: string;
};

export function VideoSummaryGrid({
  lines,
  className,
  structuredClassName,
  plainClassName,
}: VideoSummaryGridProps) {
  if (!lines.length) return null;
  const parsed = parseLines(lines);
  const hasStructured =
    parsed.length > 0 && parsed.every((line) => line.structured);

  return (
    <div className={className}>
      {hasStructured ? (
        <div
          className={cn(
            "text-foreground space-y-1 text-sm",
            structuredClassName,
          )}
        >
          {parsed.map((line) => (
            <div
              key={line.raw}
              className="grid grid-cols-[minmax(60px,1fr)_minmax(90px,auto)_minmax(0,auto)] items-center gap-3"
            >
              <div className="font-semibold">{line.resolution}</div>
              <div className="flex items-baseline gap-1 justify-self-start text-sm">
                <span className="text-muted-foreground text-xs">up to</span>
                <span className="tabular-nums">{line.fps}</span>
                <span className="text-muted-foreground text-xs">fps</span>
              </div>
              <div className="flex items-baseline gap-1 justify-self-start text-sm">
                <span className="text-muted-foreground text-xs">up to</span>
                <span className="tabular-nums">{line.bitDepth}</span>
                <span className="text-muted-foreground text-xs">bit</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={cn("text-foreground space-y-1 text-sm", plainClassName)}
        >
          {parsed.map((line) => (
            <div key={line.raw}>{line.raw}</div>
          ))}
        </div>
      )}
    </div>
  );
}
