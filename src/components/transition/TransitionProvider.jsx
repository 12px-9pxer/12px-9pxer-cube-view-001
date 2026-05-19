import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export const PageTransitionContext = createContext(null);

export default function TransitionProvider({
  children,
  getViewFromLocation,
  getUrlForView,
}) {
  const [activeView, setActiveView] = useState(getViewFromLocation);
  const [pendingView, setPendingView] = useState(null);

  const activeViewRef = useRef(activeView);
  const pendingViewRef = useRef(null);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  const startTransition = useCallback(
    (nextView, { syncUrl = true, replace = false } = {}) => {
      if (!nextView || isTransitioningRef.current || nextView === activeViewRef.current) {
        return false;
      }

      isTransitioningRef.current = true;
      pendingViewRef.current = nextView;

      if (syncUrl && getUrlForView) {
        const nextUrl = getUrlForView(nextView);
        const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

        if (nextUrl && nextUrl !== currentUrl) {
          const method = replace ? "replaceState" : "pushState";
          window.history[method](null, "", nextUrl);
        }
      }

      setPendingView(nextView);
      return true;
    },
    [getUrlForView],
  );

  useEffect(() => {
    const syncViewWithUrl = () => {
      if (isTransitioningRef.current) {
        return;
      }

      startTransition(getViewFromLocation(), { syncUrl: false });
    };

    window.addEventListener("hashchange", syncViewWithUrl);
    window.addEventListener("popstate", syncViewWithUrl);

    return () => {
      window.removeEventListener("hashchange", syncViewWithUrl);
      window.removeEventListener("popstate", syncViewWithUrl);
    };
  }, [getViewFromLocation, startTransition]);

  const completeTransition = useCallback(() => {
    const intendedView = pendingViewRef.current;
    const urlView = getViewFromLocation();
    const finalView = urlView || intendedView || activeViewRef.current;

    activeViewRef.current = finalView;
    pendingViewRef.current = null;
    isTransitioningRef.current = false;

    setActiveView(finalView);
    setPendingView(null);
  }, [getViewFromLocation]);

  const value = useMemo(
    () => ({
      activeView,
      pendingView,
      isTransitioning: Boolean(pendingView),
      navigateTo: startTransition,
      completeTransition,
    }),
    [activeView, pendingView, startTransition, completeTransition],
  );

  return (
    <PageTransitionContext.Provider value={value}>
      {children}
    </PageTransitionContext.Provider>
  );
}
