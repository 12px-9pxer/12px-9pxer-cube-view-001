import { useContext } from "react";
import { PageTransitionContext } from "../components/transition/TransitionProvider.jsx";

export default function usePageTransition() {
  const context = useContext(PageTransitionContext);

  if (!context) {
    throw new Error("usePageTransition must be used inside TransitionProvider");
  }

  return context;
}
