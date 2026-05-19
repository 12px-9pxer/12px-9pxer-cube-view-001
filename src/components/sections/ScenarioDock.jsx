import GlassButton from "../ui/GlassButton.jsx";
import SearchInput from "../ui/SearchInput.jsx";

const scenarioTags = [
  { label: "Ai 활용 기능", className: "!w-[150px]" },
  { label: "60대 은퇴 이후", className: "!w-[176px]" },
];

export default function ScenarioDock() {
  return (
    <section
      className="absolute inset-x-0 bottom-0 z-20 flex h-[261.886px] justify-center px-6 py-[40px]"
      data-layer-name="Scenario Overlay / Bottom Dock"
      data-animate="dock"
    >
      <div
        className="flex h-[181.886px] w-[calc(100vw-48px)] max-w-[1040px] min-w-0 flex-col gap-[11px] overflow-hidden rounded-[40.229px] border border-white/[0.05] bg-[#777]/20 px-[15px] py-[10px] shadow-glass-soft backdrop-blur-[35px]"
        data-layer-name="Scenario Search Bar / Newlywed Couple Case"
      >
        <SearchInput />
        <div
          className="flex w-full flex-col items-center p-[10px]"
          data-layer-name="Scenario Search Bar / Footer Area"
        >
          <div className="flex h-[54px] w-full items-center justify-between gap-4">
            <div
              className="flex min-w-0 items-center gap-[10.971px]"
              data-layer-name="Scenario Tags / List"
            >
              {scenarioTags.map((tag) => (
                <GlassButton
                  key={tag.label}
                  ariaLabel={tag.label}
                  className={`!h-[54px] !px-[22px] !py-[8px] !text-[22px] !leading-[1.5] !backdrop-blur-[9.143px] ${tag.className}`}
                >
                  <span className="whitespace-nowrap">{tag.label}</span>
                </GlassButton>
              ))}
            </div>
            <GlassButton
              active
              ariaLabel="시나리오 확장"
              className="!h-[54px] !w-[85.543px] !px-[23.771px] !py-[7.314px] !backdrop-blur-[9.143px]"
            >
              <span className="translate-y-[-1px] text-[25.6px] leading-none">
                →
              </span>
            </GlassButton>
          </div>
        </div>
      </div>
    </section>
  );
}
