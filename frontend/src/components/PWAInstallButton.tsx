import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export default function PWAInstallButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [showInstall, setShowInstall] = useState(false);

  const [showIOSHelp, setShowIOSHelp] = useState(false);

  const [isIOS, setIsIOS] = useState(false);

  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    setIsIOS(ios);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (
        window.navigator as Navigator & {
          standalone?: boolean;
        }
      ).standalone === true;

    setIsStandalone(standalone);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      setInstallPrompt(event as BeforeInstallPromptEvent);

      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  useEffect(() => {
    if (isIOS && !isStandalone) {
      setShowInstall(true);
    }
  }, [isIOS, isStandalone]);

  if (isStandalone || !showInstall) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }

    if (!installPrompt) {
      return;
    }

    try {
      await installPrompt.prompt();

      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setShowInstall(false);
      }

      setInstallPrompt(null);
    } catch (error) {
      console.error("PWA installation failed:", error);
    }
  };

  const closeInstall = () => {
    setShowInstall(false);
  };

  return (
    <>
      {/* INSTALL BUTTON */}

      <button
        type="button"
        onClick={handleInstall}
        className="fixed bottom-[86px] left-4 z-[90] flex items-center gap-2 rounded-full border border-indigo-400/40 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-xl shadow-indigo-900/40 ring-1 ring-white/10 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:from-indigo-500 hover:to-violet-500 hover:shadow-2xl active:translate-y-0 active:scale-95 lg:bottom-6 lg:left-6"
        aria-label="Install LotteryPlay"
      >
        <Download className="h-4 w-4" />

        <span>Install App</span>

        <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            closeInstall();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              closeInstall();
            }
          }}
          className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
          aria-label="Close install button"
        >
          <X className="h-3 w-3" />
        </span>
      </button>

      {/* IOS HELP */}

      {showIOSHelp && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-white">
                  Install LotteryPlay
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Add the app to your iPhone Home Screen
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSHelp(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* CONTENT */}

            <div className="space-y-5 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                  <Share className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold text-white">1. Tap Share</p>

                  <p className="mt-1 text-sm leading-5 text-slate-400">
                    In Safari, tap the Share button at the bottom of the screen.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                  <span className="text-sm font-bold">2</span>
                </div>

                <div>
                  <p className="font-semibold text-white">
                    2. Add to Home Screen
                  </p>

                  <p className="mt-1 text-sm leading-5 text-slate-400">
                    Scroll down and select{" "}
                    <strong className="text-slate-200">
                      Add to Home Screen
                    </strong>
                    .
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <span className="text-sm font-bold">3</span>
                </div>

                <div>
                  <p className="font-semibold text-white">3. Tap Add</p>

                  <p className="mt-1 text-sm leading-5 text-slate-400">
                    Confirm by tapping{" "}
                    <strong className="text-slate-200">Add</strong>.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3.5">
                <p className="text-xs leading-5 text-indigo-200">
                  After installation, LotteryPlay will appear on your Home
                  Screen and open like an app.
                </p>
              </div>
            </div>

            {/* CLOSE */}

            <div className="border-t border-slate-800 p-4">
              <button
                type="button"
                onClick={() => setShowIOSHelp(false)}
                className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
