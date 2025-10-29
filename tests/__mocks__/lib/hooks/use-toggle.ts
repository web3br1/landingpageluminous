// Mock that returns initial value and a toggle function that switches to alt value
export function useToggle<T = boolean>(initial: T, alt?: T): [T, () => void] {
  const toggle = vi.fn();

  // Mock returns initial value, but toggle function switches state
  return [initial, toggle];
}
