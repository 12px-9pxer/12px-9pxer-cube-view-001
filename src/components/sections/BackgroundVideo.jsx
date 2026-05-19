import { useEffect, useRef } from "react";
import gsap from "gsap";
import backgroundVideo from "../../assets/videos/bckvid.mp4";

export default function BackgroundVideo() {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      videoRef.current,
      { scale: 1.045 },
      { scale: 1, duration: 2.6, ease: "power3.out" },
    );

    gsap.to(overlayRef.current, {
      opacity: 0.88,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#050607]"
      data-layer-name="Background_switch to vid / Mountain Landscape"
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src={backgroundVideo}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-black/42" />
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(235,244,255,0.34)_0%,rgba(20,25,34,0.22)_28%,rgba(0,0,0,0.40)_100%)]"
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(circle_at_50%_100%,rgba(0,0,0,0.18),rgba(0,0,0,0)_62%)]" />
    </div>
  );
}
