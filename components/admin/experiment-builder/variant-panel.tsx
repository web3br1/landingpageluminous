"use client";

// ===== VARIANT PANEL COMPONENT =====
// Painel para gerenciar variantes do experimento

import React from "react";
import { VariantPanelProps } from "./types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
// Using HTML input range for now - can be replaced with shadcn/ui slider later
import {
  Plus,
  Copy,
  Trash2,
  Eye,
  Edit3,
  BarChart3,
  Users,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function VariantPanel({
  variants,
  selectedVariantId,
  onVariantSelect,
  onVariantAdd,
  onVariantDelete,
  onVariantUpdate,
}: VariantPanelProps) {
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  const handleWeightChange = (variantId: string, weight: number) => {
    onVariantUpdate(variantId, { weight: weight as number });
  };

  const handleNameChange = (variantId: string, name: string) => {
    onVariantUpdate(variantId, { name });
  };

  const duplicateVariant = (variant: unknown) => {
    const v = variant as any;
    const newVariant = {
      ...v,
      id: `variant_${Date.now()}`,
      name: `${v.name} (Cópia)`,
      weight: Math.max(10, Math.floor(v.weight / 2)), // Divide o peso
    };

    // Ajustar pesos das outras variantes
    const otherVariants = variants.filter((v) => v.id !== v.id);
    const totalOtherWeight = otherVariants.reduce(
      (sum, v) => sum + v.weight,
      0,
    );
    const adjustmentRatio = (100 - newVariant.weight) / totalOtherWeight;

    otherVariants.forEach((v) => {
      const newWeight = Math.max(5, Math.floor(v.weight * adjustmentRatio));
      onVariantUpdate(v.id, { weight: newWeight });
    });

    // Adicionar nova variante via callback
    onVariantAdd(); // Isso criará uma variante básica, depois atualizamos
    // TODO: Implementar atualização da variante recém-criada
  };

  const getTrafficPercentage = (variant: unknown) => {
    const v = variant as any;
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    return totalWeight > 0
      ? Math.round((v.weight / totalWeight) * 100)
      : 0;
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Variantes</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={onVariantAdd}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {variants.length} variante{variants.length !== 1 ? "s" : ""} • 100%
          tráfego distribuído
        </p>
      </div>

      {/* Variants List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {variants.map((variant, index) => (
            <Card
              key={variant.id}
              className={cn(
                "cursor-pointer transition-all duration-200",
                selectedVariantId === variant.id
                  ? "ring-2 ring-primary border-primary"
                  : "hover:shadow-md",
              )}
              onClick={() => onVariantSelect(variant.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        index === 0 ? "bg-green-500" : "bg-blue-500",
                      )}
                    />
                    <CardTitle className="text-sm font-medium">
                      {variant.name}
                    </CardTitle>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-6 h-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateVariant(variant);
                      }}
                      title="Duplicar variante"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>

                    {variants.length > 2 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6 text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVariantDelete(variant.id);
                        }}
                        title="Excluir variante"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Traffic allocation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <Label className="text-xs font-medium">
                      Distribuição de Tráfego
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {getTrafficPercentage(variant)}%
                    </Badge>
                  </div>

                  <input
                    type="range"
                    value={variant.weight}
                    onChange={(e) =>
                      handleWeightChange(variant.id, parseInt(e.target.value))
                    }
                    max={100}
                    min={5}
                    step={5}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Variant stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="w-3 h-3 text-gray-600" />
                    </div>
                    <div className="text-xs font-medium text-gray-900">--</div>
                    <div className="text-xs text-gray-600">Visitantes</div>
                  </div>

                  <div className="bg-gray-50 rounded p-2">
                    <div className="flex items-center justify-center mb-1">
                      <Target className="w-3 h-3 text-gray-600" />
                    </div>
                    <div className="text-xs font-medium text-gray-900">--</div>
                    <div className="text-xs text-gray-600">Conversões</div>
                  </div>

                  <div className="bg-gray-50 rounded p-2">
                    <div className="flex items-center justify-center mb-1">
                      <BarChart3 className="w-3 h-3 text-gray-600" />
                    </div>
                    <div className="text-xs font-medium text-gray-900">--%</div>
                    <div className="text-xs text-gray-600">Taxa</div>
                  </div>
                </div>

                {/* Elements count */}
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>
                    {variant.elements.length} elemento
                    {variant.elements.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="w-6 h-6">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="w-6 h-6">
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer with summary */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total de tráfego:</span>
            <span className="font-medium">
              {variants.reduce((sum, v) => sum + v.weight, 0)}%
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Variantes ativas:</span>
            <span className="font-medium">{variants.length}</span>
          </div>

          {variants.length < 2 && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              ⚠️ Adicione pelo menos 2 variantes para criar um experimento
              válido
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
