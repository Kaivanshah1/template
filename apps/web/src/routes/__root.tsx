import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useQuery } from "convex/react";
import { api } from "@ino-trips/backend/convex/_generated/api";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation } from "@tanstack/react-router";

import "../index.css";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "ino-trips",
      },
      {
        name: "description",
        content: "ino-trips is a web application",
      },
    ],
  }),
});

function RootComponent() {
  const location = useLocation();
  const user = useQuery(api.auth.getCurrentUser);
  
  // Show sidebar only on authenticated routes (not auth pages)
  const showSidebar = user && !location.pathname.startsWith("/auth");

  return (
    <>
      <HeadContent />
      {showSidebar ? (
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <Outlet />
            </div>
          </SidebarInset>
        </SidebarProvider>
      ) : (
        <Outlet />
      )}
      <TanStackRouterDevtools />
    </>
  );
}
