export function useLocalStorage<T = any>(
  key: string,
  initialValue: T,
): [T, (v: T) => void, () => void] {
  let value = initialValue;
  const setValue = (v: T) => {
    value = v;
  };
  const removeValue = () => {
    value = initialValue;
  };
  return [value, setValue, removeValue];
}
