import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import firstPageBackground from "../../assets/images/first-page-background.png";
import logo from "../../assets/images/hyundai-playbook-logo.png";
import cubeIcon from "../../assets/images/icon-cube-view.svg";
import DistortedBackground from "./DistortedBackground.jsx";
import GlassButton from "../ui/GlassButton.jsx";

function getStageLayout() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080, 1);

  return {
    scale,
    x: (window.innerWidth - 1920 * scale) / 2,
    y: (window.innerHeight - 1080 * scale) / 2,
  };
}

export default function FirstPage({ onEnterCube }) {
  const pageRef = useRef(null);
  const [stageLayout, setStageLayout] = useState(getStageLayout);

  useEffect(() => {
    const updateStageLayout = () => setStageLayout(getStageLayout());
    window.addEventListener("resize", updateStageLayout);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-first-background]",
        { scale: 1.08, opacity: 0.72 },
        { scale: 1, opacity: 1, duration: 2.8, ease: "power3.out" },
      );

      gsap.from("[data-first-card]", {
        y: 24,
        scale: 0.985,
        opacity: 0,
        filter: "blur(14px)",
        duration: 0.95,
        delay: 0.1,
        ease: "power3.out",
      });

      gsap.from("[data-first-enter]", {
        y: 10,
        scale: 0.92,
        opacity: 0,
        duration: 0.65,
        delay: 0.48,
        ease: "back.out(1.8)",
      });

      gsap.from("[data-first-logo]", {
        y: 10,
        opacity: 0,
        duration: 0.7,
        delay: 0.58,
        ease: "power3.out",
      });
    }, pageRef);

    return () => {
      window.removeEventListener("resize", updateStageLayout);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={pageRef}
      className="absolute inset-0 overflow-hidden bg-white"
      data-node-id="573:12"
      data-layer-name="Screen / First Page"
    >
      <div
        className="absolute inset-[-2px] overflow-hidden"
        data-node-id="573:19"
        data-layer-name="image 2805"
      >
        <div className="absolute inset-0 origin-center" data-first-background>
          <img
            src={firstPageBackground}
            alt=""
            className="absolute inset-0 h-full w-full select-none object-cover object-bottom"
            draggable="false"
          />
          <DistortedBackground src={firstPageBackground} />
        </div>
      </div>

      <div
        className="absolute left-0 top-0 h-[1080px] w-[1920px] origin-top-left"
        style={{
          transform: `translate3d(${stageLayout.x}px, ${stageLayout.y}px, 0) scale(${stageLayout.scale})`,
        }}
      >
        <div
          className="absolute left-[727px] top-[391px] h-[385px] w-[470px] overflow-hidden rounded-[40px] border border-white/40 bg-white/10"
          data-node-id="573:60"
          data-first-card
        >
          <div
            className="absolute left-[44px] top-[37px] flex h-[187.886px] w-[381px] flex-col items-start justify-center rounded-[24px] p-[21.943px]"
            data-node-id="573:64"
            data-layer-name="Scenario Search Bar / Title Area"
          >
            <p
              className="w-full whitespace-pre-wrap text-center text-[24px] font-bold leading-[1.5] text-white"
              data-node-id="573:65"
              data-layer-name="Search input Area_Text / Scenario Title"
            >
              {`현대플레이북 어쩌구 저쩌구
HYUNDAI PLAYBOOK

큐브맵 테스트 페이지 입니다.`}
            </p>
          </div>

          <div
            className="absolute bottom-[41px] left-1/2 -translate-x-1/2"
            data-node-id="573:56"
            data-layer-name="Button_View Switcher Option / Enter Cube View / Active"
            data-first-enter
          >
            <GlassButton
              active
              ariaLabel="Cube View 으로 입장"
              onClick={() => onEnterCube(pageRef.current)}
              className="!h-[54px] !w-[263px] gap-[6px] !px-[20px] !py-[12px] !text-[22px]"
            >
              <img
                src={cubeIcon}
                alt=""
                className="h-[24px] w-[24px] select-none object-contain"
                draggable="false"
                data-node-id="573:57"
                data-layer-name="Icon / Cube View"
              />
              <span
                className="whitespace-nowrap"
                data-node-id="573:59"
                data-layer-name="Text / Cube View Label"
              >
                Cube View 으로 입장
              </span>
            </GlassButton>
          </div>
        </div>

        <button
          type="button"
          aria-label="Hyundai Playbook 새로고침"
          onClick={() => window.location.reload()}
          className="absolute left-[895px] top-[965px] flex h-[60px] w-[165px] items-start border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          data-node-id="573:61"
          data-layer-name="Brand / Hyundai Playbook Logo"
          data-first-logo
        >
          <img
            src={logo}
            alt="Hyundai Playbook"
            className="h-auto w-full select-none object-contain"
            draggable="false"
            data-node-id="573:62"
            data-layer-name="Image / Hyundai Playbook Logo"
          />
        </button>
      </div>
    </section>
  );
}
