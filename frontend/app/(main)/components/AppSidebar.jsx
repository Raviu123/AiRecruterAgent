"use client"             //refers that this is client side
                         //"use client" is a directive used in Next.js 13 and above (especially with the App Router) to indicate that a file or component should be rendered on the client-side instead of the server.   
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
  } from "@/components/ui/sidebar"

import { usePathname } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { LogOut, Plus } from "lucide-react"
import { SidebarOptions } from "@/services/Constants"
import { signOut } from "@/services/authService"
import { useUser } from "@/app/provider"
import Link from "next/link"
//this is the sidebar ,
//shadcn has documentation for it
export function AppSidebar() {

    const path = usePathname();
    const { user, session } = useUser();

    const handleSignOut = async () => {
      try {
        await signOut();
        // AuthGuard redirects to /auth once the session is cleared.
      } catch (err) {
        console.error("Error signing out:", err);
        toast.error(`Sign out failed: ${err.message}`);
      }
    };

    return (
      <Sidebar>
        <SidebarHeader className="flex items-center  mt-5">
            <Image alt={"/"} src={"/logo.png"} width={100} height={100} className="mb-5 w-[200px]"></Image>
            <Link href="/mock-interview" className="w-[230px]">
              <Button className="w-full">Start Mock Interview<Plus/></Button>
            </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarContent>
                <SidebarMenu className="p-[5px]">
                    {SidebarOptions.map((option,index) => (
                        <SidebarMenuItem key={index} className="">
                            <SidebarMenuButton asChild className={`${path==option.path && "bg-gray-200"}`}>
                                <Link href={option.path}>
                                <option.icon/>
                                <span>{option.name}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{user?.name || "Signed in"}</p>
              <p className="truncate text-xs text-gray-500">{user?.email || session?.user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    )
  }
