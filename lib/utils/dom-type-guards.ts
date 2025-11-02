/**
 * DOM Type Guards - Fase 2 Sub-fase 3A
 * Type guards seguros para elementos DOM
 */

export function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}

export function isHTMLInputElement(element: unknown): element is HTMLInputElement {
  return element instanceof HTMLInputElement;
}

export function isHTMLButtonElement(element: unknown): element is HTMLButtonElement {
  return element instanceof HTMLButtonElement;
}

export function isHTMLDivElement(element: unknown): element is HTMLDivElement {
  return element instanceof HTMLDivElement;
}

export function isHTMLFormElement(element: unknown): element is HTMLFormElement {
  return element instanceof HTMLFormElement;
}

export function isHTMLTextAreaElement(element: unknown): element is HTMLTextAreaElement {
  return element instanceof HTMLTextAreaElement;
}

export function isHTMLSelectElement(element: unknown): element is HTMLSelectElement {
  return element instanceof HTMLSelectElement;
}

// Type guard para Event targets
export function isEventTargetWithValue(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return target instanceof HTMLInputElement ||
         target instanceof HTMLTextAreaElement ||
         target instanceof HTMLSelectElement;
}

// Type guard para elementos com dataset
export function hasDataset(element: unknown): element is HTMLElement {
  return isHTMLElement(element) && 'dataset' in element;
}

// Type guard para elementos com classList
export function hasClassList(element: unknown): element is HTMLElement {
  return isHTMLElement(element) && 'classList' in element;
}
