"use client";


// Lazy load framer-motion components
const motionComponents = new Map<string, React.ComponentType<any>>();

// Lazy load function for framer-motion
async function loadFramerMotion() {
  const { motion } = await import("framer-motion");
  return motion;
}

// Create a lazy motion component
function createLazyMotionComponent(componentName: string) {
  return React.forwardRef<any, any>((props, ref) => {
    const [MotionComponent, setMotionComponent] = useState<React.ComponentType<any> | null>(null);

    useEffect(() => {
      let mounted = true;

      loadFramerMotion().then((motion) => {
        if (mounted) {
          const Component = motion[componentName] || motion.div;
          setMotionComponent(() => Component);
        }
      });

      return () => {
        mounted = false;
      };
    }, []);

    if (!MotionComponent) {
      // Return a div with loading state while framer-motion loads
      return createElement('div', {
        ...props,
        ref,
        'data-loading': 'framer-motion',
        style: {
          ...props.style,
          opacity: 0.7,
        }
      }, props.children);
    }

    return createElement(MotionComponent, { ...props, ref });
  });
}

// Export lazy motion components
export const LazyMotionDiv = createLazyMotionComponent('div');
export const LazyMotionSection = createLazyMotionComponent('section');
export const LazyMotionButton = createLazyMotionComponent('button');
export const LazyMotionSpan = createLazyMotionComponent('span');
export const LazyMotionImg = createLazyMotionComponent('img');

// Lazy AnimatePresence
export const LazyAnimatePresence = React.forwardRef<
  any,
  { children: React.ReactNode; mode?: 'wait' | 'sync' | 'popLayout' }
>(({ children, ...props }, ref) => {
  const [AnimatePresence, setAnimatePresence] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import("framer-motion").then(({ AnimatePresence: AP }) => {
      setAnimatePresence(() => AP);
    });
  }, []);

  if (!AnimatePresence) {
    return <>{children}</>;
  }

  return createElement(AnimatePresence, { ...props, ref }, children);
});

// Utility hook for lazy loading framer-motion
export function useLazyFramerMotion() {
  const [motion, setMotion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFramerMotion().then((motionModule) => {
      setMotion(motionModule);
      setLoading(false);
    });
  }, []);

  return { motion, loading };
}

// Preload framer-motion for critical animations
export function preloadFramerMotion() {
  if (typeof window !== 'undefined') {
    // Preload framer-motion when user interacts
    const preloadMotion = () => {
      loadFramerMotion();
      document.removeEventListener('click', preloadMotion);
      document.removeEventListener('scroll', preloadMotion);
      document.removeEventListener('keydown', preloadMotion);
    };

    document.addEventListener('click', preloadMotion, { once: true });
    document.addEventListener('scroll', preloadMotion, { once: true });
    document.addEventListener('keydown', preloadMotion, { once: true });
  }
}
