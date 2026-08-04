"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  OVERVIEW_SECTION_LABELS,
  type OverviewSectionConfig,
} from "@/lib/overview-layout";
import { saveOverviewLayout } from "@/app/dashboard/customize/actions";

function SortableRow({
  section,
  onToggleVisible,
}: {
  section: OverviewSectionConfig;
  onToggleVisible: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <MagicCard className="flex items-center gap-3 rounded-xl p-4">
        <button
          type="button"
          className="text-muted-foreground cursor-grab touch-none active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <p
          className={cn(
            "flex-1 text-sm font-medium",
            !section.visible && "text-muted-foreground"
          )}
        >
          {OVERVIEW_SECTION_LABELS[section.id]}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleVisible}
          aria-label={section.visible ? "Hide section" : "Show section"}
        >
          {section.visible ? (
            <Eye className="size-4" />
          ) : (
            <EyeOff className="size-4" />
          )}
        </Button>
      </MagicCard>
    </div>
  );
}

export function CustomizeClient({
  initialLayout,
}: {
  initialLayout: OverviewSectionConfig[];
}) {
  const [layout, setLayout] = useState(initialLayout);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function persist(next: OverviewSectionConfig[]) {
    startTransition(async () => {
      const result = await saveOverviewLayout(next);
      if ("error" in result) toast.error(result.error);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = layout.findIndex((s) => s.id === active.id);
    const newIndex = layout.findIndex((s) => s.id === over.id);
    const next = arrayMove(layout, oldIndex, newIndex);
    setLayout(next);
    persist(next);
  }

  function handleToggle(id: string) {
    const next = layout.map((s) =>
      s.id === id ? { ...s, visible: !s.visible } : s
    );
    setLayout(next);
    persist(next);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" aria-label="Back to Overview">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-semibold">Customize Overview</h1>
          <p className="text-muted-foreground text-sm">
            Drag to reorder, tap the eye to show or hide a section.
          </p>
        </div>
      </div>

      <DndContext
        id="overview-layout"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={layout.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {layout.map((section) => (
              <SortableRow
                key={section.id}
                section={section}
                onToggleVisible={() => handleToggle(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {isPending && (
        <p className="text-muted-foreground text-xs">Saving...</p>
      )}
    </div>
  );
}
