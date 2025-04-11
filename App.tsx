import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import * as localizations from "@clerk/localizations";
import { dark } from "@clerk/themes";
import { ThemeProvider, useTheme } from "next-themes";
import { Provider, ErrorBoundary } from "@rollbar/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "@/i18n";

import "@/lib/rollbar";
import { rollbarConfig } from "@/lib/rollbar";
import * as report from "@/lib/report";
import "@/index.css";

import PlayerPage from "@/pages/PlayerPage";
import DualPlayerPage from "@/pages/DualPlayerPage";
import InitPage from "@/pages/InitPage";
import WordLevelSyncPage from "@/pages/WordLevelSyncPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import SyncLinePage from "@/pages/SyncLinePage";
import HomePage from "@/pages/HomePage";
import PlansPage from "@/pages/PlansPage";
import DuetEditorPage from "@/pages/DuetEditorPage";
import SettingsPage from "@/pages/SettingsPage";

import { Crisp } from "@/components/Crisp";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectPage } from "@/components/ProtectPage";

import { usePlayerStore } from "@/stores/player";
import { useSettingsStore } from "@/stores/settings";

import { ipcRenderer } from "electron";
import config from "@/config";
import { Global } from "./components/dialogs/Global";
import TrimPage from "./pages/TrimPage";
import ManualSyncPage from "./pages/ManualSyncPage";

function getLocalization(lang: string) {
  switch (lang) {
    case "en":
      return localizations.enUS;
    case "fr":
      return localizations.frFR;
    case "da":
      return localizations.daDK;
    case "de":
      return localizations.deDE;
    case "it":
      return localizations.itIT;
    case "pt":
      return localizations.ptBR;
    case "es":
      return localizations.esES;
    case "ru":
      return localizations.ruRU;
    case "sv":
      return localizations.svSE;
    case "tr":
      return localizations.trTR;
    case "nl":
      return localizations.nlNL;
    case "ja":
      return localizations.jaJP;
    case "he":
      return localizations.heIL;
    case "cs":
      return localizations.csCZ;
    case "zh":
      return localizations.zhCN;
    case "ko":
      return localizations.koKR;
    case "nb":
      return localizations.nbNO;
    case "vi":
      return localizations.viVN;
    default:
      return localizations.enUS;
  }
}

function ClerkProviderWithRoutes() {
  const lang = useSettingsStore((state) => state.lang);
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const [initSettings] = useSettingsStore((state) => [state.init]);
  const [initPlayer] = usePlayerStore((state) => [state.init]);

  useEffect(() => {
    initSettings();
    initPlayer();
  }, [initPlayer, initSettings]);

  useEffect(() => {
    ipcRenderer.on("navigate", (_, url) => {
      if (!url || !url.startsWith("http")) return;
      try {
        let { pathname, search } = new URL(url);
        const to = `${pathname.replace("/", "")}${search}`;
        navigate(to);
      } catch (e) {
        report.error("Failed to navigate", { e, url });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ClerkProvider
      localization={getLocalization(lang)}
      publishableKey={config.clerk}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
      }}
    >
      <Routes>
        <Route path="/" element={<InitPage />} />
        <Route
          path="/home"
          element={
            <>
              <ProtectPage>
                <HomePage />
              </ProtectPage>
            </>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectPage>
              <SettingsPage />
            </ProtectPage>
          }
        />
        <Route
          path="/player"
          element={
            <>
              <ProtectPage>
                <PlayerPage />
              </ProtectPage>
            </>
          }
        />
        <Route
          path="/dual-player"
          element={
            <>
              <ProtectPage>
                <DualPlayerPage />
              </ProtectPage>
            </>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectPage>
              <PlansPage />
            </ProtectPage>
          }
        />
        <Route
          path="/sync-line/:songId"
          element={
            <ProtectPage>
              <SyncLinePage />
            </ProtectPage>
          }
        />
        <Route
          path="/sync-word/:songId"
          element={
            <ProtectPage>
              <WordLevelSyncPage />
            </ProtectPage>
          }
        />
        <Route
          path="/manual-sync/:songId"
          element={
            <ProtectPage>
              <ManualSyncPage />
            </ProtectPage>
          }
        />
        <Route
          path="/duet-editor/:songId/:alignmentId"
          element={
            <ProtectPage>
              <DuetEditorPage />
            </ProtectPage>
          }
        />
        <Route
          path="/trim/:songId"
          element={
            <ProtectPage>
              <TrimPage />
            </ProtectPage>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<InitPage />} />
      </Routes>
      <Crisp />
    </ClerkProvider>
  );
}

function App() {
  return (
    <Provider config={rollbarConfig}>
      <ErrorBoundary>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <BrowserRouter>
            <TooltipProvider delayDuration={500}>
              <DndProvider backend={HTML5Backend}>
                <ClerkProviderWithRoutes />
                <Global />
              </DndProvider>

              <Toaster />
            </TooltipProvider>
          </BrowserRouter>
        </ThemeProvider>
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
