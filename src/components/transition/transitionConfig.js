export const PAGE_TRANSITION_FILTER_ID = "page-transition-wave-filter";
export const PAGE_TRANSITION_TURBULENCE_ID = "page-transition-wave-turbulence";
export const PAGE_TRANSITION_DISPLACEMENT_ID = "page-transition-wave-displacement";

const BASE_TRANSITION = {
  duration: 0.85,
  incomingDuration: 0.58,
  incomingDelay: 0.12,
  outgoingScale: 1.06,
  ease: "power3.inOut",
  wave: {
    enabled: true,
    startFrequency: "0.008 0.014",
    peakFrequency: "0.015 0.028",
    strength: 14,
  },
};

const MOBILE_TRANSITION = {
  duration: 0.7,
  incomingDuration: 0.45,
  incomingDelay: 0.08,
  outgoingScale: 1.03,
  ease: "power3.inOut",
  wave: {
    enabled: false,
    startFrequency: "0.008 0.014",
    peakFrequency: "0.011 0.018",
    strength: 0,
  },
};

const REDUCED_MOTION_TRANSITION = {
  duration: 0.2,
  incomingDuration: 0.2,
  incomingDelay: 0,
  outgoingScale: 1,
  ease: "power1.out",
  wave: {
    enabled: false,
    startFrequency: "0.008 0.014",
    peakFrequency: "0.008 0.014",
    strength: 0,
  },
};

function matchesMedia(query) {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }

  return window.matchMedia(query).matches;
}

export function getPageTransitionSettings({ allowWave = true } = {}) {
  const reducedMotion = matchesMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion) {
    return { ...REDUCED_MOTION_TRANSITION, reducedMotion, isMobile: false };
  }

  const isMobile = matchesMedia("(max-width: 640px), (pointer: coarse)");
  const preset = isMobile ? MOBILE_TRANSITION : BASE_TRANSITION;

  return {
    ...preset,
    reducedMotion,
    isMobile,
    wave: {
      ...preset.wave,
      enabled: allowWave && preset.wave.enabled,
    },
  };
}
