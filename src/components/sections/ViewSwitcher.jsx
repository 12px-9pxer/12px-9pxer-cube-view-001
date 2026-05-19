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
    className: "gap-[6px]",
  },
  { label: "User View", icon: userIcon },
  { label: "Group View", icon: groupIcon },
  { label: "Split View", icon: splitIcon },
];

export default function ViewSwitcher() {
  return (
    <nav
      aria-label="View switcher"
      className="absolute left-1/2 top-[77px] z-20 flex h-[66px] w-[412px] -translate-x-1/2 items-center justify-center rounded-full border border-white/[0.05] bg-[#777]/20 p-[6px] shadow-glass-soft backdrop-blur-[35px]"
      data-layer-name="Navigation / View Switcher HUD"
      data-animate="hud"
    >
      <div className="flex h-[54px] w-[400px] items-center justify-center gap-[5.486px]">
        {options.map((option) => (
          <GlassButton
            key={option.label}
            active={option.active}
            ariaLabel={option.label}
            className={`!h-[54px] !py-[12px] !text-[22px] ${option.active ? "!w-[177px] !min-w-[177px] !px-[20px]" : "!w-[64px] !px-0"} ${option.className ?? ""}`}
          >
            <img
              src={option.icon}
              alt=""
              className="h-[24px] w-[24px] select-none object-contain"
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
