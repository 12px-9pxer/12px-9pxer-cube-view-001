import { useRef } from "react";
import { hoverIn, hoverOut, pressIn, pressOut } from "../../lib/animations.js";
import logo from "../../assets/images/hyundai-playbook-logo.png";

export default function LogoButton() {
  const buttonRef = useRef(null);

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label="Hyundai Playbook 새로고침"
      onClick={() => window.location.reload()}
      onMouseEnter={() => hoverIn(buttonRef.current)}
      onMouseLeave={() => hoverOut(buttonRef.current)}
      onMouseDown={() => pressIn(buttonRef.current, 0.94)}
      onMouseUp={() => pressOut(buttonRef.current)}
      className="absolute left-[clamp(20px,2.08vw,40px)] top-[max(12px,calc(7.13vh-50px))] z-20 flex w-[clamp(88px,8.6vw,165px)] origin-center items-start border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-white/70 max-[520px]:top-[12px]"
      data-layer-name="Brand / Hyundai Playbook Logo"
      data-animate="hud"
      data-cube-ui
    >
      <img
        src={logo}
        alt="Hyundai Playbook"
        className="h-auto w-full select-none object-contain"
        draggable="false"
      />
    </button>
  );
}
