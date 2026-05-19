import { useEffect, useRef } from "react";
import gsap from "gsap";
import usePageTransition from "../../hooks/usePageTransition.js";
import {
  getPageTransitionSettings,
  PAGE_TRANSITION_DISPLACEMENT_ID,
  PAGE_TRANSITION_FILTER_ID,
  PAGE_TRANSITION_TURBULENCE_ID,
} from "./transitionConfig.js";
import WaveFilter from "./WaveFilter.jsx";

function resetWaveFilter() {
  const turbulence = document.getElementById(PAGE_TRANSITION_TURBULENCE_ID);
  const displacement = document.getElementById(PAGE_TRANSITION_DISPLACEMENT_ID);

  turbulence?.setAttribute("baseFrequency", "0.008 0.014");
  displacement?.setAttribute("scale", "0");
}

export default function PageTransition({ renderView }) {
  const { activeView, pendingView, completeTransition } = usePageTransition();
  const outgoingLayerRef = useRef(null);
  const incomingLayerRef = useRef(null);

  useEffect(() => {
    if (!pendingView || !outgoingLayerRef.current || !incomingLayerRef.current) {
      return undefined;
    }

    const outgoingLayer = outgoingLayerRef.current;
    const incomingLayer = incomingLayerRef.current;
    const allowWave = activeView === "first";
    const settings = getPageTransitionSettings({ allowWave });
    const waveEnabled = settings.wave.enabled;
    const turbulence = document.getElementById(PAGE_TRANSITION_TURBULENCE_ID);
    const displacement = document.getElementById(PAGE_TRANSITION_DISPLACEMENT_ID);

    resetWaveFilter();

    outgoingLayer.style.willChange = waveEnabled
      ? "transform, opacity, filter"
      : "transform, opacity";
    incomingLayer.style.willChange = "opacity";

    if (waveEnabled) {
      outgoingLayer.style.filter = `url(#${PAGE_TRANSITION_FILTER_ID})`;
    }

    gsap.set(outgoingLayer, {
      autoAlpha: 1,
      scale: 1,
      transformOrigin: "50% 50%",
      zIndex: 20,
      force3D: true,
    });
    gsap.set(incomingLayer, {
      autoAlpha: 0,
      scale: 1,
      zIndex: 10,
      force3D: true,
    });

    const timeline = gsap.timeline({
      defaults: { ease: settings.ease },
      onComplete: () => {
        gsap.set([outgoingLayer, incomingLayer], {
          clearProps: "opacity,visibility,transform,zIndex,willChange,filter",
        });
        outgoingLayer.style.willChange = "";
        incomingLayer.style.willChange = "";
        outgoingLayer.style.filter = "";
        resetWaveFilter();
        completeTransition();
      },
    });

    timeline
      .to(outgoingLayer, {
        scale: settings.outgoingScale,
        autoAlpha: 0,
        duration: settings.duration,
      })
      .to(
        incomingLayer,
        {
          autoAlpha: 1,
          duration: settings.incomingDuration,
        },
        settings.incomingDelay,
      );

    if (waveEnabled && turbulence && displacement) {
      gsap.set(turbulence, {
        attr: { baseFrequency: settings.wave.startFrequency },
      });
      gsap.set(displacement, {
        attr: { scale: 0 },
      });

      timeline
        .to(
          displacement,
          {
            attr: { scale: settings.wave.strength },
            duration: settings.duration * 0.38,
            ease: "sine.out",
          },
          0,
        )
        .to(
          displacement,
          {
            attr: { scale: 0 },
            duration: settings.duration * 0.62,
            ease: "sine.inOut",
          },
          settings.duration * 0.28,
        )
        .to(
          turbulence,
          {
            attr: { baseFrequency: settings.wave.peakFrequency },
            duration: settings.duration,
            ease: "sine.inOut",
          },
          0,
        );
    }

    return () => {
      timeline.kill();
      gsap.set([outgoingLayer, incomingLayer], {
        clearProps: "opacity,visibility,transform,zIndex,willChange,filter",
      });
      outgoingLayer.style.willChange = "";
      incomingLayer.style.willChange = "";
      outgoingLayer.style.filter = "";
      resetWaveFilter();
    };
  }, [activeView, pendingView, completeTransition]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      data-page-transition-root
      data-page-transition-state={pendingView ? "transitioning" : "idle"}
    >
      <WaveFilter />

      <div
        key={activeView}
        ref={outgoingLayerRef}
        className="absolute inset-0"
        data-page-transition-layer={pendingView ? "outgoing" : "active"}
        data-page-transition-view={activeView}
      >
        {renderView(activeView)}
      </div>

      {pendingView ? (
        <div
          key={pendingView}
          ref={incomingLayerRef}
          className="absolute inset-0 opacity-0"
          data-page-transition-layer="incoming"
          data-page-transition-view={pendingView}
        >
          {renderView(pendingView)}
        </div>
      ) : null}
    </div>
  );
}
