"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type Brand = { id: string; name: string };

export function GearCreateCard() {
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState<string>("");
  const [gearType, setGearType] = useState<"CAMERA" | "LENS" | "">("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  useEffect(() => {
    // Load brands minimal list
    (async () => {
      try {
        const res = await fetch("/api/admin/brands");
        if (res.ok) {
          const data = await res.json();
          setBrands(data.brands || []);
        }
      } catch {}
    })();
  }, []);

  const canSubmit = name.trim().length > 1 && brandId && gearType && !loading;

  const onSubmit = async () => {
    try {
      setLoading(true);
      setCreatedSlug(null);
      const res = await fetch("/api/admin/gear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), brandId, gearType }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedSlug(data.gear?.slug ?? null);
        setName("");
        setBrandId("");
        setGearType("");
      } else {
        console.error("Create failed", await res.text());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Gear</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="gear-name">Name</Label>
            <Input
              id="gear-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Nikon Z6 III"
            />
          </div>
          <div className="space-y-1">
            <Label>Brand</Label>
            <Select value={brandId} onValueChange={(v) => setBrandId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select
              value={gearType}
              onValueChange={(v) => setGearType(v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAMERA">Camera</SelectItem>
                <SelectItem value="LENS">Lens</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          {createdSlug && (
            <a
              href={`/gear/${createdSlug}`}
              className="text-primary text-sm underline"
            >
              View page →
            </a>
          )}
          <Button onClick={onSubmit} disabled={!canSubmit} loading={loading}>
            Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
