"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutDashboard, GraduationCap, BookOpen, Users } from "lucide-react"
import { fakultasApi, prodiApi } from "@/lib/api"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalFakultas: 0,
    totalProdi: 0,
    totalUsers: 0,
    loading: true,
  })

  const loadStats = async () => {
    try {
      const [fakultasResponse, prodiResponse] = await Promise.all([
        fakultasApi.getAll(),
        prodiApi.getAll(),
      ])

      setStats({
        totalFakultas: fakultasResponse.success && Array.isArray(fakultasResponse.data) 
          ? fakultasResponse.data.length 
          : 0,
        totalProdi: prodiResponse.success && Array.isArray(prodiResponse.data) 
          ? prodiResponse.data.length 
          : 0,
        totalUsers: 0, // TODO: implement when user API is ready
        loading: false,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
      setStats((prev) => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    loadStats()
    
    // Auto-refresh setiap 30 detik
    const interval = setInterval(() => {
      loadStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview sistem administrasi Skripsick
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Fakultas
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loading ? "-" : stats.totalFakultas}
            </div>
            <p className="text-xs text-muted-foreground">
              Data fakultas tersedia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Program Studi
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loading ? "-" : stats.totalProdi}
            </div>
            <p className="text-xs text-muted-foreground">
              Data program studi tersedia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loading ? "-" : stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Total pengguna terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quick Actions
            </CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Aksi cepat tersedia
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

