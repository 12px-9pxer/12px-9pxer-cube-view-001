import { useRef, useState } from "react";
import gsap from "gsap";

export default function SearchInput() {
  const wrapperRef = useRef(null);
  const [query, setQuery] = useState("");

  const animateFocus = (isFocused) => {
    gsap.to(wrapperRef.current, {
      boxShadow: isFocused
        ? "0 0 0 1px rgba(255,255,255,0.52), 0 0 34px rgba(255,255,255,0.2)"
        : "0 0 0 0 rgba(255,255,255,0)",
      backgroundColor: isFocused ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.10)",
      duration: 0.28,
      ease: "power3.out",
      overwrite: true,
    });
  };

  return (
    <div
      ref={wrapperRef}
      className="flex w-full items-center rounded-[clamp(18px,1.25vw,24px)] bg-black/10 px-[clamp(18px,2vw,22px)] py-[clamp(16px,2.03vh,22px)] backdrop-blur-[20px]"
      data-layer-name="Search input Area_Text / Scenario Title"
    >
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => animateFocus(true)}
        onBlur={() => animateFocus(false)}
        placeholder="여기에 검색어 입력"
        className="h-[33px] w-full border-0 bg-transparent text-[clamp(14px,1.15vw,22px)] font-medium leading-normal text-white outline-none placeholder:text-white/90"
      />
    </div>
  );
}
