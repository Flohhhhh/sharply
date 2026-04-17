import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { ExifViewerMetadataRow } from "../types";

type ExifMetadataTableProps = {
  rows: ExifViewerMetadataRow[];
};

function MetadataTableColumn({ rows }: { rows: ExifViewerMetadataRow[] }) {
  return (
    <div className="max-h-[min(60vh,42rem)] overflow-y-auto border-t border-white/10">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow className="hover:bg-transparent">
            <TableHead>Field</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="w-[34%] align-top whitespace-normal">
                <div>
                  <p className="font-medium">{row.tag}</p>
                  <p className="text-muted-foreground text-xs">{row.group}</p>
                </div>
              </TableCell>
              <TableCell className="align-top whitespace-pre-wrap break-words">
                {row.value || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function ExifMetadataTable({
  rows,
}: ExifMetadataTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-border">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="metadata" className="border-b-0">
          <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 hover:cursor-pointer">
            <div className="flex flex-1 items-center justify-between gap-4">
              <div className="text-left">
                <p className="text-sm">Full Metadata</p>
              </div>
              <span className="text-muted-foreground text-xs tabular-nums">
                {rows.length} rows
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            {rows.length > 0 ? (
              <MetadataTableColumn rows={rows} />
            ) : (
              <div className="text-muted-foreground px-5 py-4 text-sm">
                No metadata rows were returned for this file.
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
