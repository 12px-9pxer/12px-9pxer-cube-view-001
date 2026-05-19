import GlassButton from "../ui/GlassButton.jsx";
import cubeIcon from "../../assets/images/icon-cube-view.svg";
import userIcon from "../../assets/images/icon-user-view.svg";
import groupIcon from "../../assets/images/icon-group-view.svg";
import splitIcon from "../../assets/images/icon-split-view.svg";

const options = [
  {
    label: "Cube View",
    icon: cubeIcon,
    active: true,
    className: "gap-[6px] px-[clamp(16px,1.05vw,20px)]",
  },
  { label: "User View", icon: userIcon },
  { label: "Group View", icon: groupIcon },
  { label: "Split View", icon: splitIcon },
];

export default function ViewSwitcher() {
  return (
    <nav
      aria-label="View switcher"
      className="absolute left-1/2 top-[7.13vh] z-20 flex h-[clamp(48px,6.1vh,66px)] -translate-x-1/2 items-center justify-center rounded-full border border-white/[0.05] bg-[#777]/20 p-[clamp(4px,0.56vh,6px)] shadow-glass-soft backdrop-blur-[35px]"
      data-layer-name="Navigation / View Switcher HUD"
      data-animate="hud"
    >
      <div className="flex h-full items-center justify-center gap-[clamp(4px,0.29vw,6px)]">
        {options.map((option) => (
          <GlassButton
            key={option.label}
            active={option.active}
            ariaLabel={option.label}
            className={`${option.active ? "min-w-[clamp(132px,9.22vw,177px)]" : "w-[clamp(42px,3.34vw,64px)] !px-0"} ${option.className ?? ""}`}
          >
            <img
              src={option.icon}
              alt=""
              className="h-[clamp(18px,1.25vw,24px)] w-[clamp(18px,1.25vw,24px)] select-none object-contain"
              draggable="false"
            />
            {option.active ? (
              <span className="whitespace-nowrap">Cube View</span>
            ) : null}
          </GlassButton>
        ))}
      </div>
    </nav>
  );
}
