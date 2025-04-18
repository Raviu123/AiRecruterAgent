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
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SidebarOptions } from "@/services/Constants"
import Link from "next/link"
//this is the sidebar ,
//shadcn has documentation for it
export function AppSidebar() {

    const path = usePathname();
    console.log(path)

    return (
      <Sidebar>
        <SidebarHeader className="flex items-center  mt-5">
            <Image alt={"/"} src={"/logo.png"} width={100} height={100} className="mb-5 w-[200px]"></Image>
            <Button className="w-[230px]">Create New Interview<Plus/></Button>
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

        <SidebarFooter />
      </Sidebar>
    )
  }
