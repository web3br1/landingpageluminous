"use client";

// ===== EXPERIMENT CANVAS COMPONENT =====
// Área de trabalho visual principal do experiment builder

import { CanvasProps, EditableElement, DragItem } from "./types";
import { createEditableElement } from "./types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Move,
  Square,
  Type,
  Image as ImageIcon,
  Link,
  Heading1,
  MousePointer,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ELEMENT_TOOLS = [
  { type: "text" as const, icon: Type, label: "Texto" },
  { type: "heading" as const, icon: Heading1, label: "Título" },
  { type: "button" as const, icon: Square, label: "Botão" },
  { type: "image" as const, icon: ImageIcon, label: "Imagem" },
  { type: "link" as const, icon: Link, label: "Link" },
];

export function ExperimentCanvas({
  variant,
  mode,
  viewMode,
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  onElementAdd,
  onElementDelete,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle canvas click (deselect elements)
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        onElementSelect(null);
      }
    },
    [onElementSelect],
  );

  // Handle adding new element
  const handleAddElement = useCallback(
    (type: EditableElement["type"]) => {
      if (mode !== "design") return;

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const newElement = createEditableElement(type, variant.id, {
        x: 50,
        y: 50,
      });

      onElementAdd(newElement);
    },
    [mode, variant.id, onElementAdd],
  );

  // Handle element drag start
  const handleElementDragStart = useCallback(
    (e: React.DragEvent, element: EditableElement) => {
      if (mode !== "design") return;

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      setDragOffset({ x: offsetX, y: offsetY });
      setIsDragging(true);

      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({
          type: "existing-element",
          elementId: element.id,
        } as DragItem),
      );
    },
    [mode],
  );

  // Handle canvas drop
  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const dropX = e.clientX - canvasRect.left;
      const dropY = e.clientY - canvasRect.top;

      try {
        const dragData: DragItem = JSON.parse(
          e.dataTransfer.getData("application/json"),
        );

        if (dragData.type === "element") {
          // Adding new element from toolbar
          const newElement = createEditableElement(
            dragData.elementType!,
            variant.id,
            {
              x: dropX - dragOffset.x,
              y: dropY - dragOffset.y,
            },
          );
          onElementAdd(newElement);
        } else if (dragData.type === "existing-element") {
          // Moving existing element
          if (dragData.elementId) {
            const element = variant.elements.find(
              (el) => el.id === dragData.elementId,
            );
            if (element) {
              onElementUpdate(dragData.elementId, {
                position: {
                  ...element.position,
                  x: dropX - dragOffset.x,
                  y: dropY - dragOffset.y,
                },
              });
            }
          }
        }
      } catch (error) {
        console.warn("Failed to parse drop data:", error);
      }
    },
    [variant.elements, variant.id, dragOffset, onElementAdd, onElementUpdate],
  );

  // Handle canvas drag over
  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Render element based on type
  const renderElement = useCallback(
    (element: EditableElement) => {
      const isSelected = selectedElementId === element.id;
      const baseClasses = cn(
        "absolute cursor-pointer transition-all duration-200",
        isSelected && "ring-2 ring-primary ring-offset-2",
        mode === "design" &&
          "hover:ring-2 hover:ring-primary/50 hover:ring-offset-1",
      );

      const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onElementSelect(element.id);
      };

      const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onElementDelete(element.id);
      };

      switch (element.type) {
        case "text":
          return (
            <div
              key={element.id}
              className={baseClasses}
              style={{
                left: element.position.x,
                top: element.position.y,
                width: element.position.width,
                minHeight: element.position.height,
                ...element.styles,
              }}
              onClick={handleClick}
              draggable={mode === "design"}
              onDragStart={(e) => handleElementDragStart(e, element)}
            >
              <div className="p-2 relative group">
                {isSelected && mode === "design" && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
                <div
                  contentEditable={isSelected && mode === "design"}
                  suppressContentEditableWarning
                  className="outline-none"
                  onBlur={(e) => {
                    const newText = e.currentTarget.textContent || "";
                    onElementUpdate(element.id, {
                      content: { ...(element.content as any), text: newText },
                    });
                  }}
                >
                  {(element.content as any).text}
                </div>
              </div>
            </div>
          );

        case "heading":
          return (
            <div
              key={element.id}
              className={baseClasses}
              style={{
                left: element.position.x,
                top: element.position.y,
                width: element.position.width,
                minHeight: element.position.height,
                ...element.styles,
              }}
              onClick={handleClick}
              draggable={mode === "design"}
              onDragStart={(e) => handleElementDragStart(e, element)}
            >
              <div className="p-2 relative group">
                {isSelected && mode === "design" && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
                <div
                  contentEditable={isSelected && mode === "design"}
                  suppressContentEditableWarning
                  className={cn(
                    "outline-none",
                    (element.content as any).level === 1 && "text-3xl font-bold",
                    (element.content as any).level === 2 && "text-2xl font-bold",
                    (element.content as any).level === 3 && "text-xl font-semibold",
                  )}
                  onBlur={(e) => {
                    const newText = e.currentTarget.textContent || "";
                    onElementUpdate(element.id, {
                      content: { ...(element.content as any), text: newText },
                    });
                  }}
                >
                  {(element.content as any).text}
                </div>
              </div>
            </div>
          );

        case "button":
          return (
            <div
              key={element.id}
              className={baseClasses}
              style={{
                left: element.position.x,
                top: element.position.y,
                width: element.position.width,
                height: element.position.height,
              }}
              onClick={handleClick}
              draggable={mode === "design"}
              onDragStart={(e) => handleElementDragStart(e, element)}
            >
              <div className="relative group h-full">
                {isSelected && mode === "design" && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  className="w-full h-full"
                  style={element.styles}
                  onClick={(e) => {
                    if (mode === "design") {
                      e.stopPropagation();
                    }
                  }}
                >
                  {(element.content as any).text}
                </Button>
              </div>
            </div>
          );

        case "image":
          return (
            <div
              key={element.id}
              className={baseClasses}
              style={{
                left: element.position.x,
                top: element.position.y,
                width: element.position.width,
                height: element.position.height,
              }}
              onClick={handleClick}
              draggable={mode === "design"}
              onDragStart={(e) => handleElementDragStart(e, element)}
            >
              <div className="relative group h-full">
                {isSelected && mode === "design" && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
                <div
                  className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
                  style={element.styles}
                >
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Imagem</span>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    },
    [
      selectedElementId,
      mode,
      onElementSelect,
      onElementDelete,
      onElementUpdate,
      handleElementDragStart,
    ],
  );

  // Get canvas dimensions based on view mode
  const getCanvasDimensions = () => {
    switch (viewMode) {
      case "mobile":
        return { width: 375, height: 667 };
      case "tablet":
        return { width: 768, height: 1024 };
      case "desktop":
      default:
        return { width: 1200, height: 800 };
    }
  };

  const { width, height } = getCanvasDimensions();

  return (
    <div className="flex h-full">
      {/* Element Toolbar - Only in design mode */}
      {mode === "design" && (
        <div className="w-16 bg-gray-50 border-r border-gray-200 p-2 flex flex-col gap-2">
          {ELEMENT_TOOLS.map((tool) => (
            <Button
              key={tool.type}
              variant="outline"
              size="icon"
              className="w-12 h-12"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  "application/json",
                  JSON.stringify({
                    type: "element",
                    elementType: tool.type,
                  } as DragItem),
                );
              }}
              title={tool.label}
            >
              <tool.icon className="w-5 h-5" />
            </Button>
          ))}
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-100 p-8">
        <div className="flex justify-center">
          <Card
            className={cn(
              "relative bg-white shadow-lg transition-all duration-300",
              isDragging && "ring-2 ring-primary ring-offset-4",
              mode === "preview" && "pointer-events-none",
            )}
            style={{ width, height }}
          >
            {/* Canvas */}
            <div
              ref={canvasRef}
              className={cn(
                "relative w-full h-full overflow-hidden",
                mode === "design" && "cursor-crosshair",
              )}
              onClick={handleCanvasClick}
              onDrop={handleCanvasDrop}
              onDragOver={handleCanvasDragOver}
            >
              {/* Render all elements */}
              {variant.elements.map(renderElement)}

              {/* Empty state */}
              {variant.elements.length === 0 && mode === "design" && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <MousePointer className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">
                      Arraste elementos da barra lateral para começar
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Canvas info overlay */}
            {mode === "design" && (
              <div className="absolute top-2 left-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                {variant.name} - {viewMode}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
