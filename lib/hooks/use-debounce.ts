
/**
 * Hook para debounced values - atrasa atualizações até que o usuário pare de digitar
 * @param value - Valor a ser debounced
 * @param delay - Delay em ms (padrão 300)
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced;
}
