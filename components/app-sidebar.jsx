"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  User2,
  Building2,
  Plus,
  Search,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";

// Admin Menu items
const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Jobs",
    url: "/admin/jobs",
    icon: Briefcase,
  },
  {
    title: "Candidates",
    url: "/admin/candidates",
    icon: Users,
  },
  {
    title: "My Resume",
    url: "/admin/resume",
    icon: FileText,
  },
];

const adminQuickActions = [
  {
    title: "Create Job",
    url: "/admin/jobs/create",
    icon: Plus,
  },
  {
    title: "Search Applications",
    url: "/admin/candidates",
    icon: Search,
  },
];

// Job Seeker Menu items
const seekerMenuItems = [
  {
    title: "Dashboard",
    url: "/seeker/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Browse Jobs",
    url: "/jobs",
    icon: Briefcase,
  },
  {
    title: "Applications",
    url: "/seeker/applications",
    icon: FileText,
  },
  {
    title: "Saved Jobs",
    url: "/seeker/saved-jobs",
    icon: Users,
  },
];

const seekerQuickActions = [
  {
    title: "Find Jobs",
    url: "/jobs",
    icon: Plus,
  },
  {
    title: "My Profile",
    url: "/seeker/profile",
    icon: Search,
  },
];

export function AppSidebar({ role = "admin" }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Select menu items based on role
  const mainMenuItems = role === "seeker" ? seekerMenuItems : adminMenuItems;
  const quickActions = role === "seeker" ? seekerQuickActions : adminQuickActions;
  
  // Get header branding based on role
  const headerIcon = role === "seeker" ? Users : Building2;
  const headerBrand = role === "seeker" ? "AI Career" : "AI-HRMS";
  const headerSubtitle = role === "seeker" ? "Job Portal" : "HR Portal";
  const headerGradient = role === "seeker" 
    ? "from-teal-600 to-cyan-600" 
    : "from-blue-600 to-blue-700";
  const headerBgGradient = role === "seeker"
    ? "from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20"
    : "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20";
  const userGradient = role === "seeker" 
    ? "from-teal-600 to-cyan-600" 
    : "from-purple-600 to-pink-600";

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200 dark:border-gray-800">
      <SidebarHeader className={`border-b border-gray-200 dark:border-gray-800 bg-linear-to-r ${headerBgGradient}`}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200">
              <Link href={role === "seeker" ? "/seeker/dashboard" : "/admin/dashboard"} className="group">
                <div className={`flex aspect-square size-8 items-center justify-center rounded-lg bg-linear-to-br ${headerGradient} text-white shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  {role === "seeker" ? <Users className="size-4" /> : <Building2 className="size-4" />}
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-bold text-gray-900 dark:text-white">{headerBrand}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {headerSubtitle}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainMenuItems.map((item, index) => (
                <SidebarMenuItem key={item.title} className="animate-in slide-in-from-left-4 fade-in" style={{ animationDelay: `${index * 50}ms`, animationDuration: '300ms' }}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className={`
                      transition-all duration-200 group
                      ${pathname === item.url 
                        ? role === "seeker"
                          ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 font-semibold shadow-sm hover:shadow-md'
                          : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-semibold shadow-sm hover:shadow-md'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:translate-x-1'
                      }
                    `}
                  >
                    <Link href={item.url} className="flex items-center w-full">
                      <item.icon className={`transition-all duration-200 ${pathname === item.url ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span className="transition-all duration-200">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 flex items-center">
            <Plus className="mr-2 h-3 w-3" />
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {quickActions.map((item, index) => (
                <SidebarMenuItem key={item.title} className="animate-in slide-in-from-left-4 fade-in" style={{ animationDelay: `${(index + 3) * 50}ms`, animationDuration: '300ms' }}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    className="hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-green-700 dark:hover:text-green-300 transition-all duration-200 hover:translate-x-1 group"
                  >
                    <Link href={item.url} className="flex items-center w-full">
                      <item.icon className="transition-all duration-200 group-hover:scale-110 group-hover:rotate-12" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={`data-[state=open]:${role === "seeker" ? "bg-teal-50 dark:data-[state=open]:bg-teal-950/30 data-[state=open]:text-teal-700 dark:data-[state=open]:text-teal-300" : "bg-blue-50 dark:data-[state=open]:bg-blue-950/30 data-[state=open]:text-blue-700 dark:data-[state=open]:text-blue-300"} hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group`}
                >
                  <div className={`flex aspect-square size-8 items-center justify-center rounded-lg bg-linear-to-br ${userGradient} text-white shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                    <User2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-gray-900 dark:text-white">
                      {session?.user?.name || "User"}
                    </span>
                    <span className="truncate text-xs text-gray-600 dark:text-gray-400">
                      {session?.user?.email || ""}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border-gray-200 dark:border-gray-800 shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild className={`hover:${role === "seeker" ? "bg-teal-50 dark:hover:bg-teal-950/30" : "bg-blue-50 dark:hover:bg-blue-950/30"} transition-colors duration-150 cursor-pointer`}>
                  <Link href={role === "seeker" ? "/seeker/dashboard" : "/admin/dashboard"} className="flex items-center">
                    <LayoutDashboard className={`mr-2 h-4 w-4 ${role === "seeker" ? "text-teal-600" : "text-blue-600"}`} />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={`hover:${role === "seeker" ? "bg-teal-50 dark:hover:bg-teal-950/30" : "bg-blue-50 dark:hover:bg-blue-950/30"} transition-colors duration-150 cursor-pointer`}>
                  <Link href={role === "seeker" ? "/seeker/profile" : "/admin/settings"} className="flex items-center">
                    <Settings className="mr-2 h-4 w-4 text-gray-600" />
                    <span>{role === "seeker" ? "Profile" : "Settings"}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-red-600 focus:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30 transition-colors duration-150 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-medium">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
