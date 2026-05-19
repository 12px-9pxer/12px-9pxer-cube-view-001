import { useCallback } from "react";
import CubeView from "../sections/CubeView.jsx";
import FirstPage from "../sections/FirstPage.jsx";
import PageTransition from "../transition/PageTransition.jsx";
import TransitionProvider from "../transition/TransitionProvider.jsx";
import usePageTransition from "../../hooks/usePageTransition.js";

const CUBE_HASH = "#cube";

function getViewFromHash() {
  return window.location.hash === CUBE_HASH ? "cube" : "first";
}

function getUrlForView(view) {
  const baseUrl = `${window.location.pathname}${window.location.search}`;
  return view === "cube" ? `${baseUrl}${CUBE_HASH}` : baseUrl;
}

function ScreenShellContent() {
  const { navigateTo } = usePageTransition();

  const renderView = useCallback(
    (view) =>
      view === "cube" ? (
        <CubeView />
      ) : (
        <FirstPage onEnterCube={() => navigateTo("cube")} />
      ),
    [navigateTo],
  );

  return (
    <main className="relative h-screen min-h-[540px] w-screen overflow-hidden bg-[#050607] font-pretendard text-white">
      <PageTransition renderView={renderView} />
    </main>
  );
}

export default function ScreenShell() {
  return (
    <TransitionProvider
      getViewFromLocation={getViewFromHash}
      getUrlForView={getUrlForView}
    >
      <ScreenShellContent />
    </TransitionProvider>
  );
}
