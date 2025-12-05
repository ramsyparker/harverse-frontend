"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { userAuthApi } from "@/lib/api"
import { Loader2, User, Mail, GraduationCap, BookOpen, LogOut } from "lucide-react"
import { toast } from "sonner"

interface User {
  nama?: string
  email?: string
  nomor_induk_mahasiswa?: string
  fakultas_id?: {
    nama: string
    kode: string
  }
  prodi_id?: {
    nama: string
    kode: string
  }
  is_verified?: boolean
}

export default function UserDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      if (!userAuthApi.isAuthenticated()) {
        router.push("/users/register")
        return
      }

      try {
        // Fetch user data from backend to get complete data with fakultas and prodi
        const response = await userAuthApi.getProfile()
        if (response.success && response.data) {
          // Update localStorage with fresh data
          localStorage.setItem("user_data", JSON.stringify(response.data))
          setUser(response.data)
        } else {
          // Fallback to localStorage if API fails
          const userData = userAuthApi.getCurrentUser()
          if (userData) {
            setUser(userData)
          }
        }
      } catch {
        // Fallback to localStorage if API fails
        const userData = userAuthApi.getCurrentUser()
        if (userData) {
          setUser(userData as User)
        }
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const handleLogout = () => {
    userAuthApi.logout()
    toast.success("Berhasil logout")
    router.push("/users/register")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Data user tidak ditemukan</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/users/register")} className="w-full">
              Kembali ke Registrasi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Selamat datang di Skripsick!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Pribadi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                <p className="text-lg font-medium">{user.nama || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-lg font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nomor Induk Mahasiswa</p>
                <p className="text-lg font-medium">{user.nomor_induk_mahasiswa || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Program Studi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Fakultas
                </p>
                <p className="text-lg font-medium">
                  {user.fakultas_id?.nama || "-"} {user.fakultas_id?.kode ? `(${user.fakultas_id.kode})` : ""}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Program Studi
                </p>
                <p className="text-lg font-medium">
                  {user.prodi_id?.nama || "-"} {user.prodi_id?.kode ? `(${user.prodi_id.kode})` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status Akun</CardTitle>
            <CardDescription>Informasi status verifikasi akun Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status Verifikasi</p>
                <p className="text-lg font-medium">
                  {user.is_verified ? (
                    <span className="text-green-600">✓ Terverifikasi</span>
                  ) : (
                    <span className="text-yellow-600">Belum Terverifikasi</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

