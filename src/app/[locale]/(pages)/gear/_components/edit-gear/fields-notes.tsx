"use client";

import { Plus } from "lucide-react";
import { useTranslations, type TranslationValues } from "next-intl";
import { useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Card,CardContent,CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  getSpecSectionTitle,
  translateGearDetailWithFallback,
} from "~/lib/i18n/gear-detail";

interface NotesFieldsProps {
  notes: string[];
  onChange: (next: string[]) => void;
  sectionId?: string;
}

export function NotesFields({ notes, onChange, sectionId }: NotesFieldsProps) {
  const t = useTranslations("gearDetail");
  const tf = (key: string, fallback: string, values?: TranslationValues) =>
    translateGearDetailWithFallback(t, key, fallback, values);
  const values = useMemo(() => (Array.isArray(notes) ? notes : []), [notes]);

  return (
    <Card
      id={sectionId}
      className="gap-2 rounded-md border-0 bg-transparent px-0 py-0"
    >
      <CardTitle className="text-2xl">
        {getSpecSectionTitle(t, "notes", "Notes")}
      </CardTitle>
      <CardContent className="space-y-4 px-0">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">
            {tf(
              "editGear.notes.description",
              "Add unstructured notes about this gear. Keep each thought as a separate note.",
            )}
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
                placeholder={tf("editGear.notes.notePlaceholder", "Note #{index}", {
                  index: idx + 1,
                })}
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
                  {tf("editGear.notes.remove", "Remove")}
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
              {tf("editGear.notes.add", "Add note")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
