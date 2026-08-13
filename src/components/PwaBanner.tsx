import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, WifiOff, X } from "lucide-react";
import { Workbox } from "workbox-window";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { store } from "@/lib/store";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "cusp-tech-pwa-banner-dismissed";
const INSTALL_SNOOZE_KEY = "cusp-tech-pwa-install-snoozed";

export default function PwaBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [snoozedUpdate, setSnoozedUpdate] = useState(false);
  const [installSnoozed, setInstallSnoozed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(INSTALL_SNOOZE_KEY) === "1";
  });
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(DISMISS_KEY) === "1";
  });
  const [needRefresh, setNeedRefresh] = useState(false);
  const [workbox, setWorkbox] = useState<Workbox | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV && "serviceWorker" in navigator) {
      const wb = new Workbox(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });

      wb.addEventListener("waiting", () => {
        setNeedRefresh(true);
      });

      wb.addEventListener("controlling", () => {
        window.location.reload();
      });

      wb.register().catch(() => {
        // Ignore registration failures; the app still works without SW.
      });

      setWorkbox(wb);
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (window.localStorage.getItem(INSTALL_SNOOZE_KEY) === "1") {
        return;
      }

      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstallPrompt(null);
      setDismissed(true);
      window.localStorage.setItem(DISMISS_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const isInstallable = Boolean(installPrompt) && !dismissed && !installSnoozed;
  const shouldShow = (needRefresh && !snoozedUpdate) || isInstallable;

  const title = useMemo(() => {
    if (needRefresh) {
      return "Update ready";
    }

    if (isInstallable) {
      return `${store.partnerName} PWA`;
    }

    return `${store.partnerName} PWA`;
  }, [isInstallable, needRefresh]);

  if (!shouldShow) {
    return null;
  }

  const handleDismiss = () => {
    if (needRefresh) {
      setSnoozedUpdate(true);
      return;
    }

    setInstallSnoozed(true);
    setDismissed(true);
    window.localStorage.setItem(INSTALL_SNOOZE_KEY, "1");
  };

  const handleInstall = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setDismissed(true);
      window.localStorage.setItem(DISMISS_KEY, "1");
      window.localStorage.removeItem(INSTALL_SNOOZE_KEY);
    }

    setInstallPrompt(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <Card className="pointer-events-auto w-full max-w-md border-border/70 bg-card/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/90">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              needRefresh ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary",
            )}>
              {needRefresh ? <RefreshCw className="h-5 w-5" /> : isInstallable ? <Download className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold leading-none">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {needRefresh
                      ? "A newer version is available. Refresh to load the latest billing and PWA updates."
                      : "Install the app for faster access, full-screen use, and offline caching."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Dismiss PWA banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {needRefresh ? (
                  <Button type="button" size="sm" onClick={() => workbox?.messageSkipWaiting()}>
                    Refresh now
                  </Button>
                ) : null}

                {isInstallable ? (
                  <Button type="button" size="sm" variant="outline" onClick={handleInstall}>
                    Install app
                  </Button>
                ) : null}

                <Button type="button" size="sm" variant="ghost" onClick={handleDismiss}>
                  {needRefresh ? "Later" : "Not now"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
