import { Upload } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type ExifEmptyStateProps = {
  isDragging: boolean;
  onBrowse: () => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
};

export default function ExifEmptyState({
  isDragging,
  onBrowse,
  onDragOver,
  onDragLeave,
  onDrop,
}: ExifEmptyStateProps) {
  return (
    <motion.div
      role="button"
      tabIndex={0}
      className={cn(
        "bg-background border-muted-foreground/30 hover:brightness-95 dark:hover:brightness-110 flex min-h-72 cursor-pointer items-center justify-center rounded-lg border-2 border-dotted px-6 py-12 text-center transition-all",
        isDragging && "border-foreground/50 bg-muted/50",
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onBrowse}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onBrowse();
        }
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <div className="bg-muted text-muted-foreground rounded-full p-4">
          <Upload className="size-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Upload an image file</h2>
          <p className="text-muted-foreground text-sm">Provide a Raw or JPG file straight from your camera (not edited). We will extract your camera's shutter count and other metadata.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={(event) => {
            event.stopPropagation();
            onBrowse();
          }}
        >
          Browse files
        </Button>
      </div>
    </motion.div>
  );
}
