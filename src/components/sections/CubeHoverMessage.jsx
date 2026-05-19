import { forwardRef } from "react";

export const CUBE_HOVER_TITLE_TEXT = "Cube#11287484823";
export const CUBE_HOVER_MESSAGE_TEXT = `이 큐브는 이런저런 유저의 스토리를 담고있는 아주 멋진 큐브라는 사실을 알고있는지요......

한번 눌러보시는 것도 나쁘지 않을 듯................`;

const CubeHoverMessage = forwardRef(function CubeHoverMessage(
  { contentRef, panelRef, textRef },
  ref,
) {
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute left-0 top-0 z-[80] h-[284.25px] w-[285.75px]"
      data-cube-hover-message
      style={{ opacity: 0, visibility: "hidden", willChange: "transform, opacity" }}
    >
      <div
        ref={panelRef}
        className="h-[284.25px] w-[285.75px]"
        style={{ willChange: "transform, opacity, filter" }}
      >
        <section
          ref={contentRef}
          className="pointer-events-auto relative h-[284.25px] w-[285.75px] select-none overflow-hidden rounded-[30px] border border-white/35 bg-[#AFAFAF]/70 text-white shadow-[0_18px_54px_rgba(50,50,55,0.2)] backdrop-blur-[28px]"
          data-layer-name="Frame 9"
          style={{ willChange: "transform" }}
        >
          <div
            className="absolute left-0 top-0 h-[180.414px] w-[285.75px]"
            data-layer-name="Scenario Search Bar / Title Area"
          >
            <p
              className="absolute left-[16.457px] top-[16.457px] h-[36px] w-[252.836px] text-left text-[24px] font-bold leading-[1.5] tracking-[-0.24px] text-white"
              data-layer-name="Search input Area_Text / Cube Title"
            >
              {CUBE_HOVER_TITLE_TEXT}
            </p>
            <p
              ref={textRef}
              className="absolute left-[16.457px] top-[95.957px] h-[68px] w-[252.836px] whitespace-pre-line text-left text-[10.5px] font-bold leading-[1.5] tracking-[-0.105px] text-white"
              data-layer-name="Search input Area_Text / Scenario Title"
            />
          </div>
        </section>
      </div>
    </div>
  );
});

export default CubeHoverMessage;
