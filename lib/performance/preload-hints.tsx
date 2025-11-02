/**
 * PreloadHints - Componente React para hints de preload no HTML head
 */
import React from 'react';

export interface PreloadHintProps {
  resources?: PreloadResource[];
}

export interface PreloadResource {
  url: string;
  type: 'image' | 'font' | 'script' | 'style';
  priority: 'high' | 'medium' | 'low';
  crossOrigin?: boolean;
  integrity?: string;
}

export function PreloadHints({ resources = [] }: PreloadHintProps) {
  // Recursos críticos padrão para preload
  const defaultResources: PreloadResource[] = [
    { url: '/fonts/inter-var.woff2', type: 'font', priority: 'high', crossOrigin: true },
    { url: '/images/logo.webp', type: 'image', priority: 'high' },
  ];

  const allResources = [...defaultResources, ...resources];

  return (
    <>
      {allResources.map((resource, index) => (
        <link
          key={`${resource.url}-${index}`}
          rel="preload"
          href={resource.url}
          as={resource.type}
          crossOrigin={resource.crossOrigin ? 'anonymous' : undefined}
          integrity={resource.integrity}
          fetchPriority={
            resource.priority === 'high' ? 'high' :
            resource.priority === 'low' ? 'low' : 'auto'
          }
        />
      ))}
    </>
  );
}
