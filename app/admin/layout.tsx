"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb"
import { authApi } from "@/lib/api"
import { Bell } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === "/admin/login"
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    if (!isLoginPage && !authApi.isAuthenticated()) {
      router.push("/admin/login")
    }
  }, [router, isLoginPage])

  // Prevent hydration mismatch - render same structure on server and client
  if (!mounted) {
    if (isLoginPage) {
      return <>{children}</>
    }
    return <div className="min-h-screen" />
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (!authApi.isAuthenticated()) {
    return null
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <AdminBreadcrumb />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Notifikasi</SheetTitle>
                <SheetDescription>
                  Notifikasi dan pembaruan sistem
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="text-center text-sm text-muted-foreground py-8">
                  Tidak ada notifikasi baru
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

