"use client";

import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  extractGearQueryCandidates,
  extractTopGearQueryCandidate,
} from "~/lib/utils/discord-message-handler";

export default function ExtractorDemo() {
  const [message, setMessage] = useState("");
  const [top, setTop] = useState<string | null>(null);
  const [all, setAll] = useState<string[]>([]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const candidates = extractGearQueryCandidates(message);
    setAll(candidates);
    setTop(extractTopGearQueryCandidate(message));
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <Input
          placeholder='@ui-demo: enter a message, e.g. "have you looked at Z6iii?"'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button type="submit">Submit</Button>
      </form>

      <div className="space-y-2">
        <div className="text-sm">
          <span className="font-medium">Top candidate:</span>{" "}
          <span className="text-muted-foreground">
            {top ?? "(none extracted)"}
          </span>
        </div>
        <div>
          <div className="text-sm font-medium">All candidates (ordered):</div>
          {all.length === 0 ? (
            <div className="text-muted-foreground text-sm">(none)</div>
          ) : (
            <ul className="list-inside list-disc text-sm">
              {all.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


