import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import CubeView from "../sections/CubeView.jsx";
import FirstPage from "../sections/FirstPage.jsx";

const CUBE_HASH = "#cube";

function getViewFromHash() {
  return window.location.hash === CUBE_HASH ? "cube" : "first";
}

export default function ScreenShell() {
  const shellRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const [activeView, setActiveView] = useState(getViewFromHash);

  useEffect(() => {
    const syncViewWithUrl = () => {
      if (!isTransitioningRef.current) {
        setActiveView(getViewFromHash());
      }
    };

    window.addEventListener("hashchange", syncViewWithUrl);
    window.addEventListener("popstate", syncViewWithUrl);

    return () => {
      window.removeEventListener("hashchange", syncViewWithUrl);
      window.removeEventListener("popstate", syncViewWithUrl);
    };
  }, []);

  const enterCubeView = useCallback(
    (firstPageElement) => {
      if (activeView === "cube" || isTransitioningRef.current) {
        return;
      }

      const showCubeView = () => {
        if (window.location.hash !== CUBE_HASH) {
          window.history.pushState(
            null,
            "",
            `${window.location.pathname}${window.location.search}${CUBE_HASH}`,
          );
        }

        setActiveView("cube");
        isTransitioningRef.current = false;
      };

      if (!firstPageElement) {
        showCubeView();
        return;
      }

      isTransitioningRef.current = true;

      gsap.context(() => {
        gsap
          .timeline({
            defaults: { ease: "power3.inOut" },
            onComplete: showCubeView,
          })
          .to("[data-first-card]", {
            y: -18,
            scale: 0.965,
            opacity: 0,
            filter: "blur(18px)",
            duration: 0.5,
          })
          .to(
            "[data-first-background]",
            {
              scale: 1.08,
              opacity: 0,
              filter: "blur(28px)",
              duration: 0.7,
            },
            0,
          )
          .to(
            "[data-first-logo]",
            {
              y: 16,
              opacity: 0,
              duration: 0.38,
            },
            0,
          )
          .to(
            firstPageElement,
            {
              autoAlpha: 0,
              duration: 0.45,
            },
            0.2,
          );
      }, firstPageElement);
    },
    [activeView],
  );

  return (
    <main
      ref={shellRef}
      className="relative h-screen min-h-[540px] w-screen overflow-hidden bg-[#050607] font-pretendard text-white"
    >
      {activeView === "cube" ? (
        <CubeView />
      ) : (
        <FirstPage onEnterCube={enterCubeView} />
      )}
    </main>
  );
}
