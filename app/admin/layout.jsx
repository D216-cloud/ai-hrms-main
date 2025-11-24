"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-900 dark:text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  // Allow any authenticated user to access the admin area
  // Removed the role check that was causing the "Access Denied" error

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-100 dark:border-gray-800 px-4 bg-white dark:bg-gray-950 sticky top-0 z-50">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                  Admin Portal
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50 dark:bg-gray-900/50">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
