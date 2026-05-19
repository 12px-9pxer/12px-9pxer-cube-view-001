import { useEffect, useRef } from "react";
import gsap from "gsap";
import BackgroundVideo from "./BackgroundVideo.jsx";
import LogoButton from "../ui/LogoButton.jsx";
import ScenarioDock from "./ScenarioDock.jsx";
import ViewSwitcher from "./ViewSwitcher.jsx";

export default function CubeView() {
  const cubeRef = useRef(null);

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

  return (
    <section
      ref={cubeRef}
      className="absolute inset-0"
      data-node-id="533:307"
      data-layer-name="Screen / Cube View"
    >
      <BackgroundVideo />
      <LogoButton />
      <ViewSwitcher />
      <ScenarioDock />
    </section>
  );
}
