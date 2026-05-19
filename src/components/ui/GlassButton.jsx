import { useRef } from "react";
import { hoverIn, hoverOut, pressIn, pressOut } from "../../lib/animations.js";

export default function GlassButton({
  children,
  className = "",
  active = false,
  ariaLabel,
  onClick,
}) {
  const buttonRef = useRef(null);

  const baseTone = active
    ? "bg-[#2c2c2d] text-white"
    : "bg-black/40 text-white hover:bg-black/55";

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseEnter={() => hoverIn(buttonRef.current)}
      onMouseLeave={() => hoverOut(buttonRef.current)}
      onMouseDown={() => pressIn(buttonRef.current)}
      onMouseUp={() => pressOut(buttonRef.current)}
      onFocus={() => hoverIn(buttonRef.current)}
      onBlur={() => hoverOut(buttonRef.current)}
      className={`inline-flex h-[clamp(42px,5vh,54px)] shrink-0 items-center justify-center rounded-full px-[clamp(14px,1.15vw,22px)] py-2 text-[clamp(14px,1.15vw,22px)] font-medium leading-normal outline-none backdrop-blur-[18px] transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-white/70 ${baseTone} ${className}`}
    >
      {children}
    </button>
  );
}
