"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Plus } from "lucide-react";

interface NotesFieldsProps {
  notes: string[];
  onChange: (next: string[]) => void;
  sectionId?: string;
}

export function NotesFields({ notes, onChange, sectionId }: NotesFieldsProps) {
  const values = useMemo(() => (Array.isArray(notes) ? notes : []), [notes]);

  return (
    <Card
      id={sectionId}
      className="gap-2 rounded-md border-0 bg-transparent px-0 py-0"
    >
      <CardTitle className="text-2xl">Notes</CardTitle>
      <CardContent className="space-y-4 px-0">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">
            Add unstructured notes about this gear. Keep each thought as a
            separate note.
          </Label>
        </div>

        <div className="space-y-3">
          {values.map((val, idx) => (
            <div key={idx} className="space-y-2">
              <Textarea
                value={val}
                onChange={(e) => {
                  const next = [...values];
                  next[idx] = e.target.value;
                  onChange(next);
                }}
                placeholder={`Note #${idx + 1}`}
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const next = values.filter((_, i) => i !== idx);
                    onChange(next);
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}

          <div>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => onChange([...values, ""])}
              icon={<Plus className="size-4" />}
            >
              Add note
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
