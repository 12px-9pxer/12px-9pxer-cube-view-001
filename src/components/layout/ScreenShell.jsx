import { useEffect, useRef } from "react";
import gsap from "gsap";
import BackgroundVideo from "../sections/BackgroundVideo.jsx";
import LogoButton from "../ui/LogoButton.jsx";
import ScenarioDock from "../sections/ScenarioDock.jsx";
import ViewSwitcher from "../sections/ViewSwitcher.jsx";

export default function ScreenShell() {
  const shellRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
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
    }, shellRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={shellRef}
      className="relative h-screen min-h-[540px] w-screen overflow-hidden bg-[#050607] font-pretendard text-white"
      data-node-id="533:307"
      data-layer-name="Screen / Cube View"
    >
      <BackgroundVideo />
      <LogoButton />
      <ViewSwitcher />
      <ScenarioDock />
    </main>
  );
}
