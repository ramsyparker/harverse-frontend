"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { userAuthApi } from "@/lib/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function VerifyOTPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const returnTo = searchParams.get("returnTo") || ""

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""))
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendTimer, setResendTimer] = useState(0)
  const [devOtp, setDevOtp] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!email) {
      toast.error("Email tidak ditemukan, silakan daftar ulang")
      router.push("/users/register")
    }
  }, [email, router])

  useEffect(() => {
    inputRef.current?.focus()
    // Ambil OTP dari localStorage untuk development mode
    const storedOtp = localStorage.getItem('dev_otp')
    if (storedOtp) {
      setDevOtp(storedOtp)
      localStorage.removeItem('dev_otp') // Hapus setelah diambil
    }
  }, [])

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

    const handleResend = async () => {
      if (resendTimer > 0) return

      const emailToUse = email?.toLowerCase()
      if (!emailToUse || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
        toast.error("Email tidak valid")
        return
      }

      setResendLoading(true)
      try {
        const response = await userAuthApi.requestOTP(emailToUse)
        if (response.success) {
          // Simpan OTP ke state untuk ditampilkan (development mode)
          if (response.data && 'otp_code' in response.data && typeof response.data.otp_code === 'string') {
            setDevOtp(response.data.otp_code)
          }
          toast.success("Kode OTP baru sudah dikirim!")
          setResendTimer(60)
        } else {
          toast.error(response.message || "Gagal mengirim ulang kode")
        }
      } catch {
        toast.error("Gagal mengirim ulang kode")
      } finally {
        setResendLoading(false)
      }
    }

  const handleSubmit = async () => {
    setError("")
    const fullOtp = otp.join("")
    const emailToUse = email?.toLowerCase()

    if (!emailToUse) {
      setError("Email tidak ditemukan")
      return
    }

    if (!fullOtp) {
      setError("Kode OTP wajib diisi")
      return
    }

    if (fullOtp.length !== 6) {
      setError("Kode OTP harus 6 digit")
      return
    }

    setLoading(true)
    try {
      const response = await userAuthApi.verifyOTP(emailToUse, fullOtp)

      if (response.success) {
        const userData = userAuthApi.getCurrentUser()
        if (userData) {
          userData.is_verified = true
          localStorage.setItem("user_data", JSON.stringify(userData))
        }

        toast.success("Email berhasil diverifikasi!")

        if (returnTo === "register") {
          setTimeout(() => {
            router.push(`/users/register?verified=true&email=${encodeURIComponent(emailToUse)}`)
          }, 1000)
        } else {
          setTimeout(() => {
            router.push("/users/dashboard")
          }, 1500)
        }
      } else {
        setError(response.message || "Kode OTP tidak valid")
        toast.error(response.message || "Kode OTP tidak valid")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const isOtpComplete = otp.every((digit) => digit !== "")
  const progress = 66.67

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="mb-8 max-w-md">
          <div className="h-[2px] w-full bg-gray-700 relative">
            <div
              className="absolute top-0 left-0 h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/users/register")}
            disabled={loading}
            className="text-white text-base hover:text-gray-300 disabled:opacity-50 transition-colors"
          >
            Kembali
          </button>
        </div>

        {/* Main Content */}
        <div className="mb-16">
          <div className="space-y-8">
            <div className="space-y-3 text-left">
              <h2 className="text-3xl font-semibold text-white leading-tight">
                Cek Email kamu dan Verifikasi dulu yaa!
              </h2>
              <p className="text-sm text-gray-400">
                Kalo gadapet email bisa cek di folder spam atau klik kirim ulang kode di bawah
              </p>
            </div>

            <div className="space-y-6 max-w-md">
              {/* Display OTP in development mode */}
              {devOtp && (
                <div className="p-4 rounded-lg bg-yellow-500/20 border border-yellow-500/50">
                  <p className="text-sm text-yellow-400 font-medium mb-1">
                    🔧 Development Mode - OTP Code:
                  </p>
                  <p className="text-2xl font-bold text-yellow-300 font-mono tracking-wider">
                    {devOtp}
                  </p>
                  <p className="text-xs text-yellow-400/80 mt-2">
                    Kode ini hanya muncul di development mode
                  </p>
                </div>
              )}

              <Input
                ref={inputRef}
                type="text"
                placeholder="Masukin OTP yang di kirim ke Email Kamu"
                value={otp.join("")}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                  const newOtp = Array(6).fill("")
                  for (let i = 0; i < value.length; i++) {
                    newOtp[i] = value[i]
                  }
                  setOtp(newOtp)
                  if (error) setError("")
                }}
                className={cn(
                  "h-12 text-base rounded-lg border-2 border-gray-700 bg-gray-900/50 text-white placeholder:text-gray-500 focus:border-gray-500 focus:ring-0",
                  error && "border-red-500"
                )}
                disabled={loading}
                maxLength={6}
                inputMode="numeric"
              />

              {error && (
                <p className="text-sm text-red-400 text-left">{error}</p>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={handleResend}
                  disabled={resendTimer > 0 || resendLoading || loading}
                  className="text-white text-base hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Kirim ulang kode
                  {resendTimer > 0 && (
                    <span className="ml-2 text-gray-400">
                      {resendTimer} Detik
                    </span>
                  )}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !isOtpComplete || !email}
                  className="text-white text-base hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Konfirmasi...
                    </>
                  ) : (
                    "Konfirmasi"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
