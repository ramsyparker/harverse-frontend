"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { userAuthApi } from "@/lib/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    emailOrNim: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!formData.emailOrNim.trim()) {
      setErrors({ emailOrNim: "Email atau NIM wajib diisi" })
      return
    }

    if (!formData.password) {
      setErrors({ password: "Password wajib diisi" })
      return
    }

    setLoading(true)
    try {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailOrNim.trim())
      
      const response = await userAuthApi.login(
        isEmail ? undefined : formData.emailOrNim.trim().toUpperCase(),
        isEmail ? formData.emailOrNim.trim().toLowerCase() : undefined,
        formData.password
      )

      if (response.success && response.data) {
        const data = response.data as { token?: string; user?: Record<string, unknown> }
        if (data.token) {
          localStorage.setItem("user_token", data.token)
        }
        if (data.user) {
          localStorage.setItem("user_data", JSON.stringify(data.user))
        }

        toast.success("Berhasil login!")
        router.push("/users/dashboard")
      } else {
        toast.error(response.message || "Gagal login")
        setErrors({ submit: response.message || "Gagal login" })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ada error nih"
      toast.error(errorMessage)
      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="w-full max-w-md space-y-10">
        {/* Header */}
        <div>
          <Link href="/users/register" className="text-white hover:text-gray-300 text-base transition-colors">
            Daftar
          </Link>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          <h1 className="text-5xl font-bold text-white leading-tight">
            Selamat Datang di Skripsick !
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Email atau NIM"
                  value={formData.emailOrNim}
                  onChange={(e) => {
                    setFormData({ ...formData, emailOrNim: e.target.value })
                    if (errors.emailOrNim) setErrors({ ...errors, emailOrNim: "" })
                  }}
                  className="h-16 text-lg rounded-lg border-2 border-gray-700 bg-gray-900/50 text-white placeholder:text-gray-500 focus:border-gray-500 focus:ring-0"
                  disabled={loading}
                  aria-invalid={!!errors.emailOrNim}
                />
                {errors.emailOrNim && (
                  <p className="text-sm text-red-400">{errors.emailOrNim}</p>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (errors.password) setErrors({ ...errors, password: "" })
                  }}
                  className="h-16 text-lg rounded-lg border-2 border-gray-700 bg-gray-900/50 text-white placeholder:text-gray-500 focus:border-gray-500 focus:ring-0"
                  disabled={loading}
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password}</p>
                )}
              </div>
            </div>

            {errors.submit && (
              <div className="p-3 rounded-lg bg-red-500/20 text-sm text-red-400 text-center">
                {errors.submit}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 text-lg rounded-lg bg-white text-black hover:bg-gray-200 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Masuk...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link
              href="/users/forgot-password"
              className="text-white hover:text-gray-300 text-base transition-colors"
            >
              Lupa Password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
