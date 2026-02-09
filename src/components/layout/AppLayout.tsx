import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileTabBar } from "./MobileTabBar";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const location = useLocation();

  // Don't show nav on auth/onboarding pages
  const hideNav = ["/auth", "/onboarding", "/account-type", "/brand-onboarding"].includes(location.pathname);

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && <DesktopSidebar />}
      <main className={`flex-1 ${isMobile ? "pb-20" : "ml-64"}`}>
        {children}
      </main>
      {isMobile && <MobileTabBar />}
    </div>
  );
}
