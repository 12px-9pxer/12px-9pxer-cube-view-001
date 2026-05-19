import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import CubeMapScene from "./CubeMapScene.jsx";
import LogoButton from "../ui/LogoButton.jsx";
import ScenarioDock from "./ScenarioDock.jsx";
import ViewSwitcher from "./ViewSwitcher.jsx";

export default function CubeView() {
  const cubeRef = useRef(null);
  const [isCubeFocused, setIsCubeFocused] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cubeRef.current,
        { autoAlpha: 0, scale: 1.012 },
        { autoAlpha: 1, scale: 1, duration: 0.75, ease: "power3.out" },
      );

      gsap.from("[data-animate='hud']", {
        y: -14,
        opacity: 0,
        filter: "blur(10px)",
        duration: 0.85,
        stagger: 0.08,
        ease: "power3.out",
      });

      gsap.from("[data-animate='dock']", {
        y: 42,
        opacity: 0,
        filter: "blur(12px)",
        duration: 1,
        delay: 0.18,
        ease: "power3.out",
      });
    }, cubeRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const uiElements = gsap.utils.toArray(cubeRef.current?.querySelectorAll("[data-cube-ui]"));

    if (!uiElements.length) {
      return undefined;
    }

    if (!isCubeFocused) {
      gsap.set(uiElements, {
        autoAlpha: 1,
        filter: "blur(0px)",
        pointerEvents: "auto",
      });
    }

    gsap.to(uiElements, {
      autoAlpha: isCubeFocused ? 0 : 1,
      filter: isCubeFocused ? "blur(10px)" : "blur(0px)",
      duration: isCubeFocused ? 0.28 : 0.36,
      ease: "power3.out",
      overwrite: true,
      pointerEvents: isCubeFocused ? "none" : "auto",
      onComplete: () => {
        uiElements.forEach((element) => {
          element.style.visibility = isCubeFocused ? "hidden" : "visible";
          element.style.pointerEvents = isCubeFocused ? "none" : "auto";
        });
      },
    });

    return () => {
      gsap.killTweensOf(uiElements);
      gsap.set(uiElements, {
        autoAlpha: 1,
        filter: "blur(0px)",
        pointerEvents: "auto",
      });
    };
  }, [isCubeFocused]);

  return (
    <section
      ref={cubeRef}
      className="absolute inset-0"
      data-node-id="533:307"
      data-layer-name="Screen / Cube View"
    >
      <CubeMapScene onFocusChange={setIsCubeFocused} />
      <LogoButton />
      <ViewSwitcher />
      <ScenarioDock />
    </section>
  );
}
