"use client"

import React from "react"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import { LayoutDashboard } from "lucide-react"

const pathMap: Record<string, string> = {
  dashboard: "Dashboard",
  fakultas: "Fakultas",
  prodi: "Program Studi",
  settings: "Settings",
}

export function AdminBreadcrumb() {
  const pathname = usePathname()
  const paths = pathname.split("/").filter(Boolean)
  
  // Skip "admin" dari path
  const adminPaths = paths.slice(1)
  
  // Filter path setelah dashboard
  const displayPaths = adminPaths.slice(1) // Skip dashboard karena sudah ada di home

  return (
    <Breadcrumb>
      <BreadcrumbList className="items-center">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {displayPaths.map((path, index) => {
          const isLast = index === displayPaths.length - 1
          const href = `/admin/${adminPaths.slice(0, index + 2).join("/")}` // +2 karena skip admin dan include dashboard
          const label = pathMap[path] || path.charAt(0).toUpperCase() + path.slice(1)

          return (
            <React.Fragment key={`${path}-${index}`}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

