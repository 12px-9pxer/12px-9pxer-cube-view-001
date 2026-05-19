import GlassButton from "../ui/GlassButton.jsx";
import SearchInput from "../ui/SearchInput.jsx";

const scenarioTags = [
  { label: "Ai 활용 기능", className: "!w-[112px]" },
  { label: "60대 은퇴 이후", className: "!w-[132px]" },
];

export default function ScenarioDock() {
  return (
    <section
      className="absolute inset-x-0 bottom-0 z-20 flex h-[216.664px] justify-center px-6 py-[40px]"
      data-layer-name="Scenario Overlay / Bottom Dock"
      data-animate="dock"
      data-cube-ui
    >
      <div
        className="flex h-[136.664px] w-[calc(100vw-48px)] max-w-[780px] min-w-0 flex-col gap-[8.25px] overflow-hidden rounded-[30.171px] bg-[#777]/20 px-[11.25px] py-[7.5px] shadow-glass-soft outline outline-[0.75px] outline-offset-[-0.75px] outline-white/[0.05] backdrop-blur-[26.25px]"
        data-layer-name="Scenario Search Bar / Newlywed Couple Case"
      >
        <SearchInput />
        <div
          className="flex w-full flex-col items-center p-[7.5px]"
          data-layer-name="Scenario Search Bar / Footer Area"
        >
          <div className="flex h-[40.5px] w-full items-center justify-between gap-4">
            <div
              className="flex min-w-0 items-center gap-[8.229px]"
              data-layer-name="Scenario Tags / List"
            >
              {scenarioTags.map((tag) => (
                <GlassButton
                  key={tag.label}
                  ariaLabel={tag.label}
                  className={`!h-[40.5px] !rounded-[749.25px] !px-[16.5px] !py-[6px] !text-[16.5px] !leading-[1.5] !tracking-[-0.165px] !backdrop-blur-[6.857px] ${tag.className}`}
                >
                  <span className="whitespace-nowrap">{tag.label}</span>
                </GlassButton>
              ))}
            </div>
            <GlassButton
              active
              ariaLabel="시나리오 확장"
              className="!h-[40.5px] !w-[64.657px] !rounded-[1370.057px] !px-[17.829px] !py-[5.486px] !backdrop-blur-[6.857px]"
            >
              <span className="translate-y-[-1px] text-[19.2px] leading-none tracking-[-0.192px]">
                →
              </span>
            </GlassButton>
          </div>
        </div>
      </div>
    </section>
  );
}
