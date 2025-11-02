"use client";

// ===== PROPERTY PANEL COMPONENT =====
// Painel de propriedades para editar elementos selecionados

import React from "react";
import { PropertyPanelProps } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

export function PropertyPanel({ element, onUpdate }: PropertyPanelProps) {
  if (!element) return null;

  const handleContentChange = (field: string, value: unknown) => {
    onUpdate({
      content: {
        ...(element.content as any),
        [field]: value,
      },
    });
  };

  const handleStyleChange = (field: string, value: unknown) => {
    onUpdate({
      styles: {
        ...element.styles,
        [field]: value,
      },
    });
  };

  const handlePositionChange = (
    field: keyof typeof element.position,
    value: number,
  ) => {
    onUpdate({
      position: {
        ...element.position,
        [field]: value,
      },
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 capitalize">
          {element.type === "heading"
            ? "Título"
            : element.type === "text"
              ? "Texto"
              : element.type === "button"
                ? "Botão"
                : element.type === "image"
                  ? "Imagem"
                  : element.type === "link"
                    ? "Link"
                    : element.type}
        </h3>
        <Button variant="ghost" size="icon" className="w-6 h-6">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Element-specific properties */}
        {element.type === "text" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Texto</Label>
                <Textarea
                  value={(element.content as any).text || ""}
                  onChange={(e) => handleContentChange("text", e.target.value)}
                  placeholder="Digite o texto..."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {element.type === "heading" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Texto</Label>
                <Input
                  value={(element.content as any).text || ""}
                  onChange={(e) => handleContentChange("text", e.target.value)}
                  placeholder="Digite o título..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Nível</Label>
                <select
                  value={(element.content as any).level || 1}
                  onChange={(e) =>
                    handleContentChange("level", parseInt(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value={1}>Título 1 (H1)</option>
                  <option value={2}>Título 2 (H2)</option>
                  <option value={3}>Título 3 (H3)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        {element.type === "button" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Texto do botão</Label>
                <Input
                  value={(element.content as any).text || ""}
                  onChange={(e) => handleContentChange("text", e.target.value)}
                  placeholder="Ex: Clique aqui"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Link</Label>
                <Input
                  value={(element.content as any).link || ""}
                  onChange={(e) => handleContentChange("link", e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Styling properties */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Estilos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Cor do texto</Label>
                <Input
                  type="color"
                  value={typeof element.styles.color === "string" ? element.styles.color : "#000000"}
                  onChange={(e) => handleStyleChange("color", e.target.value)}
                  className="mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Tamanho</Label>
                <Input
                  type="number"
                  value={parseInt((element.styles as any).fontSize) || 16}
                  onChange={(e) =>
                    handleStyleChange("fontSize", `${e.target.value}px`)
                  }
                  className="mt-1"
                  min={8}
                  max={72}
                />
              </div>
            </div>

            {(element.type === "button" || element.type === "container") && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Fundo</Label>
                  <Input
                    type="color"
                    value={(element.styles as any).backgroundColor || "#ffffff"}
                    onChange={(e) =>
                      handleStyleChange("backgroundColor", e.target.value)
                    }
                    className="mt-1 h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Borda</Label>
                  <Input
                    type="number"
                    value={parseInt((element.styles as any).borderRadius) || 0}
                    onChange={(e) =>
                      handleStyleChange("borderRadius", `${e.target.value}px`)
                    }
                    className="mt-1"
                    min={0}
                    max={50}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Position properties */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Posição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  value={element.position.x}
                  onChange={(e) =>
                    handlePositionChange("x", parseInt(e.target.value) || 0)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input
                  type="number"
                  value={element.position.y}
                  onChange={(e) =>
                    handlePositionChange("y", parseInt(e.target.value) || 0)
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Largura</Label>
                <Input
                  type="number"
                  value={element.position.width}
                  onChange={(e) =>
                    handlePositionChange(
                      "width",
                      parseInt(e.target.value) || 100,
                    )
                  }
                  className="mt-1"
                  min={50}
                />
              </div>
              <div>
                <Label className="text-xs">Altura</Label>
                <Input
                  type="number"
                  value={element.position.height}
                  onChange={(e) =>
                    handlePositionChange(
                      "height",
                      parseInt(e.target.value) || 30,
                    )
                  }
                  className="mt-1"
                  min={30}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
