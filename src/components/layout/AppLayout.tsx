import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileTabBar } from "./MobileTabBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/hooks/useAuth";

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useAuth();

  // Don't show nav on auth/onboarding pages
  const hideNav = ["/auth", "/onboarding", "/account-type", "/brand-onboarding"].includes(location.pathname);

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && <DesktopSidebar />}
      <main className={`flex-1 ${isMobile ? "pb-20" : "ml-64"}`}>
        {/* Top bar with notification bell */}
        {user && (
          <div className="sticky top-0 z-40 flex justify-end items-center p-4 bg-background/80 backdrop-blur-sm border-b">
            <NotificationBell />
          </div>
        )}
        {children}
      </main>
      {isMobile && <MobileTabBar />}
    </div>
  );
}
