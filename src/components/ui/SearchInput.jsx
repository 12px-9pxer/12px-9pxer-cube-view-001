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
      className="flex w-full items-center rounded-[24px] bg-black/10 p-[21.943px] backdrop-blur-[20px]"
      data-layer-name="Search input Area_Text / Scenario Title"
    >
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => animateFocus(true)}
        onBlur={() => animateFocus(false)}
        placeholder="여기에 검색어 입력"
        className="h-[33px] w-full border-0 bg-transparent text-[22px] font-medium leading-[1.5] text-white outline-none placeholder:text-white/90"
      />
    </div>
  );
}
