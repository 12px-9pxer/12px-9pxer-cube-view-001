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
    className: "gap-[4.5px]",
  },
  { label: "User View", icon: userIcon },
  { label: "Group View", icon: groupIcon },
  { label: "Split View", icon: splitIcon },
];

export default function ViewSwitcher() {
  return (
    <nav
      aria-label="View switcher"
      className="absolute left-[calc(50%+0.5px)] top-[35.25px] z-20 flex h-[49.5px] w-[309px] -translate-x-1/2 items-center justify-center rounded-[749.25px] border-[0.75px] border-white/[0.05] bg-[#777]/20 shadow-glass-soft backdrop-blur-[26.25px]"
      data-layer-name="Navigation / View Switcher HUD"
      data-animate="hud"
      data-cube-ui
    >
      <div className="flex h-[40.5px] w-[300px] items-center justify-center gap-[4.114px]">
        {options.map((option) => (
          <GlassButton
            key={option.label}
            active={option.active}
            ariaLabel={option.label}
            className={`!h-[40.5px] !rounded-[30.171px] !py-[9px] !text-[16.5px] !leading-[1.5] !backdrop-blur-[13.714px] ${option.active ? "!w-[132.5px] !min-w-[132.5px] !px-[15px]" : "!w-[48px] !px-[15px]"} ${option.className ?? ""}`}
          >
            <img
              src={option.icon}
              alt=""
              className="h-[18px] w-[18px] select-none object-contain"
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
