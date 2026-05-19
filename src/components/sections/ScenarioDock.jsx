import GlassButton from "../ui/GlassButton.jsx";
import SearchInput from "../ui/SearchInput.jsx";

const scenarioTags = ["Ai 활용 기능", "60대 은퇴 이후"];

export default function ScenarioDock() {
  return (
    <section
      className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-6 py-[clamp(24px,3.7vh,40px)] sm:px-8 lg:px-[clamp(24px,22.92vw,440px)]"
      data-layer-name="Scenario Overlay / Bottom Dock"
      data-animate="dock"
    >
      <div
        className="flex w-full min-w-0 max-w-[1040px] flex-col gap-[clamp(8px,1.02vh,11px)] rounded-[clamp(26px,2.1vw,40px)] border border-white/[0.05] bg-[#777]/20 px-[clamp(18px,1.56vw,30px)] py-[clamp(16px,1.86vh,20px)] shadow-glass-soft backdrop-blur-[35px]"
        data-layer-name="Scenario Search Bar / Newlywed Couple Case"
      >
        <SearchInput />
        <div
          className="flex w-full flex-col items-center p-[clamp(8px,0.93vh,10px)]"
          data-layer-name="Scenario Search Bar / Footer Area"
        >
          <div className="flex h-[clamp(42px,5vh,54px)] w-full items-center justify-between gap-4">
            <div
              className="flex min-w-0 items-center gap-[clamp(8px,0.57vw,11px)]"
              data-layer-name="Scenario Tags / List"
            >
              {scenarioTags.map((tag) => (
                <GlassButton key={tag} ariaLabel={tag}>
                  <span className="whitespace-nowrap">{tag}</span>
                </GlassButton>
              ))}
            </div>
            <GlassButton
              active
              ariaLabel="시나리오 확장"
              className="w-[clamp(54px,4.46vw,86px)] !px-0"
            >
              <span className="translate-y-[-1px] text-[clamp(18px,1.33vw,26px)] leading-none">
                →
              </span>
            </GlassButton>
          </div>
        </div>
      </div>
    </section>
  );
}
