import {
  PAGE_TRANSITION_DISPLACEMENT_ID,
  PAGE_TRANSITION_FILTER_ID,
  PAGE_TRANSITION_TURBULENCE_ID,
} from "./transitionConfig.js";

export default function WaveFilter() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute h-0 w-0"
      focusable="false"
    >
      <defs>
        <filter
          id={PAGE_TRANSITION_FILTER_ID}
          x="-8%"
          y="-8%"
          width="116%"
          height="116%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            id={PAGE_TRANSITION_TURBULENCE_ID}
            type="fractalNoise"
            baseFrequency="0.008 0.014"
            numOctaves="2"
            seed="9"
            result="waveNoise"
          />
          <feDisplacementMap
            id={PAGE_TRANSITION_DISPLACEMENT_ID}
            in="SourceGraphic"
            in2="waveNoise"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
