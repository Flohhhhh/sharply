"use client";

import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";

export type SortableUserListItem = {
  id: string;
  position: number;
  gear: {
    slug: string;
    name: string;
    regionalAliases: Array<{
      gearId: string;
      region: "GLOBAL" | "EU" | "JP";
      name: string;
      createdAt: string | Date;
      updatedAt: string | Date;
    }> | null;
    brandName: string | null;
  };
};

type ListSortableItemsProps = {
  items: SortableUserListItem[];
  onReorder: (orderedItemIds: string[]) => void;
  onRemove: (itemId: string) => void;
  disabled?: boolean;
};

export function ListSortableItems({
  items,
  onReorder,
  onRemove,
  disabled = false,
}: ListSortableItemsProps) {
  const [localOrder, setLocalOrder] = useState(items);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = useMemo(() => localOrder.map((item) => item.id), [localOrder]);

  useEffect(() => {
    setLocalOrder(items);
  }, [items]);

  if (!localOrder.length) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
        This list is empty.
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localOrder.findIndex((item) => item.id === active.id);
    const newIndex = localOrder.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const nextOrder = arrayMove(localOrder, oldIndex, newIndex);
    setLocalOrder(nextOrder);
    onReorder(nextOrder.map((item) => item.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {localOrder.map((item) => (
            <SortableRow
              key={item.id}
              item={item}
              onRemove={onRemove}
              disabled={disabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  item,
  onRemove,
  disabled,
}: {
  item: SortableUserListItem;
  onRemove: (itemId: string) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.id,
      disabled,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-background flex items-center gap-2 rounded-md border p-2"
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-grab p-1 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
        <span className="sr-only">Drag to reorder</span>
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.gear.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {item.gear.brandName ?? "Unknown brand"}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(item.id)}
        disabled={disabled}
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Remove item</span>
      </Button>
    </div>
  );
}
