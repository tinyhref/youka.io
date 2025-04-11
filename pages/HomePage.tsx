import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { CreateKaraoke } from "@/components/dialogs/CreateKaraoke";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { usePlayerStore } from "@/stores/player";
import { CTA } from "@/components/CTA";
import { useMetadata } from "@/hooks/metadata";
import { SocialCTA } from "@/components/ctas/socialCTA";
import { UpgradeCTA } from "@/components/ctas/upgradeCTA";
import { LibraryCTA } from "@/components/ctas/libraryCTA";
import { QuickStartCTA } from "@/components/ctas/quickStartCTA";
import { useSettingsStore } from "@/stores/settings";

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [createKaraokeOpen, setCreateKaraokeOpen] = useState(false);
  const [role, songs, creditsData] = usePlayerStore((state) => [
    state.role,
    state.songs,
    state.creditsData,
  ]);
  const showQuickStart = useSettingsStore((state) => state.showQuickStart);
  const setShowQuickStart = useSettingsStore(
    (state) => state.setShowQuickStart
  );
  const { hideSocial } = useMetadata();

  const isLibraryEmpty = Object.keys(songs).length === 0;

  useEffect(() => {
    console.log("role", role);
  }, [role]);

  return (
    <>
      <div>
        <Header
          showChangelog
          showNotifications
          showProfile
          showLang
          showSettings
          showSpace
          showInternetStatus
          showVideoGuides
          showFaq
          breadcrumbs={[
            {
              label: t("Home"),
              url: "/home",
            },
          ]}
        />

        <CreateKaraoke
          open={createKaraokeOpen}
          onOpenChange={setCreateKaraokeOpen}
        />

        <div className="flex flex-col align-center justify-center items-center h-screen-minus-40">
          <div className="flex flex-col items-center gap-4 w-[40vw]">
            <div className="text-2xl font-bold mb-4">
              {t("Welcome to Youka")}
              <FontAwesomeIcon className="ml-2 text-red-500" icon={faHeart} />
            </div>

            {showQuickStart && (
              <QuickStartCTA onHide={() => setShowQuickStart(false)} />
            )}

            {!creditsData?.hasCredits &&
              !hideSocial &&
              ["en", "fr", "it", "de"].includes(i18n.language) && <SocialCTA />}
            {!creditsData?.hasCredits && <UpgradeCTA />}
            {!isLibraryEmpty && <LibraryCTA />}

            {role && creditsData?.hasCredits && (
              <CTA
                onClick={() => setCreateKaraokeOpen(true)}
                icon={
                  <FontAwesomeIcon icon={faPlus} className="text-purple-500" />
                }
                title={t("Create Karaoke")}
                description={t("create.description")}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
