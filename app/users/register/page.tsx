"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { userAuthApi, fakultasApi, prodiApi } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface Fakultas {
  _id: string
  nama: string
  kode: string
}

interface Prodi {
  _id: string
  nama: string
  kode: string
  fakultas_id: string
}

interface FormData {
  nama: string
  email: string
  fakultas_id: string
  prodi_id: string
  nomor_induk_mahasiswa: string
  password: string
  confirmPassword: string
}

const TOTAL_STEPS = 5

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailVerified = searchParams.get("verified") === "true"
  const emailFromQuery = searchParams.get("email") || ""
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fakultas, setFakultas] = useState<Fakultas[]>([])
  const [prodi, setProdi] = useState<Prodi[]>([])
  const [loadingProdi, setLoadingProdi] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Form data - load from localStorage if exists
  const [formData, setFormData] = useState<FormData>(() => {
    const defaultData: FormData = {
      nama: "",
      email: "",
      fakultas_id: "",
      prodi_id: "",
      nomor_induk_mahasiswa: "",
      password: "",
      confirmPassword: "",
    }
    
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('register_form_data')
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Partial<FormData>
          return { ...defaultData, ...parsed }
        } catch {
          return defaultData
        }
      }
    }
    return defaultData
  })

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Save formData to localStorage whenever it changes (except password fields for security)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dataToSave = {
        nama: formData.nama,
        email: formData.email,
        fakultas_id: formData.fakultas_id,
        prodi_id: formData.prodi_id,
        nomor_induk_mahasiswa: formData.nomor_induk_mahasiswa,
        // Don't save password and confirmPassword for security
      }
      localStorage.setItem('register_form_data', JSON.stringify(dataToSave))
    }
  }, [formData.nama, formData.email, formData.fakultas_id, formData.prodi_id, formData.nomor_induk_mahasiswa])

  // Check if email is verified and move to next step
  useEffect(() => {
    if (emailVerified) {
      // Update email from query if provided and not already set
      if (emailFromQuery && !formData.email) {
        setFormData((prev: FormData) => ({ ...prev, email: emailFromQuery }))
      }
      // Clear all errors when skipping to step 3 after email verification
      setErrors({})
      setCurrentStep(3) // Skip to Fakultas & Prodi after email verification
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailVerified, emailFromQuery])

  useEffect(() => {
    loadFakultas()
  }, [])

  // Load prodi ketika fakultas dipilih
  useEffect(() => {
    if (formData.fakultas_id) {
      loadProdi(formData.fakultas_id)
    } else {
      setProdi([])
      setFormData((prev: FormData) => ({ ...prev, prodi_id: "" }))
    }
  }, [formData.fakultas_id])

  // Auto focus input when step changes dan clear errors yang tidak relevan
  useEffect(() => {
    if (!isAnimating) {
      // Clear errors yang tidak relevan dengan step saat ini
      const relevantFields: Record<number, string[]> = {
        1: ['nama'],
        2: ['email'],
        3: ['fakultas_id', 'prodi_id'],
        4: ['nomor_induk_mahasiswa'],
        5: ['password', 'confirmPassword', 'submit']
      }

      const fieldsToKeep = relevantFields[currentStep] || []
      const cleanedErrors: Record<string, string> = {}

      // Hanya keep error yang relevan dengan step saat ini
      Object.keys(errors).forEach(key => {
        if (fieldsToKeep.includes(key)) {
          cleanedErrors[key] = errors[key]
        }
      })

      // Pastikan error yang tidak relevan benar-benar dihapus
      setErrors(cleanedErrors)
      
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isAnimating])

  const loadFakultas = async () => {
    try {
      const response = await fakultasApi.getAll()
      if (response.success && response.data && Array.isArray(response.data)) {
        setFakultas(response.data)
      }
    } catch (err) {
      console.error("Error loading fakultas:", err)
    }
  }

  const loadProdi = async (fakultasId: string) => {
    setLoadingProdi(true)
    setProdi([])
    setFormData((prev) => ({ ...prev, prodi_id: "" }))
    try {
      const response = await prodiApi.getByFakultas(fakultasId)
      if (response.success && response.data && Array.isArray(response.data)) {
        setProdi(response.data)
      }
    } catch (err) {
      console.error("Error loading prodi:", err)
      toast.error("Gagal memuat data prodi")
    } finally {
      setLoadingProdi(false)
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.nama.trim()) {
          newErrors.nama = "Nama wajib diisi"
        } else if (formData.nama.trim().length < 2) {
          newErrors.nama = "Minimal 2 karakter"
        }
        break

      case 2:
        if (!formData.email.trim()) {
          newErrors.email = "Email wajib diisi"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Format email salah"
        }
        break

      case 3:
        if (!formData.fakultas_id) {
          newErrors.fakultas_id = "Pilih fakultas dulu"
        }
        if (!formData.prodi_id) {
          newErrors.prodi_id = "Pilih prodi dulu"
        }
        break

      case 4:
        if (!formData.nomor_induk_mahasiswa.trim()) {
          newErrors.nomor_induk_mahasiswa = "NIM wajib diisi"
        } else if (formData.nomor_induk_mahasiswa.trim().length < 5) {
          newErrors.nomor_induk_mahasiswa = "Minimal 5 karakter"
        }
        break

      case 5:
        if (!formData.password) {
          newErrors.password = "Password wajib diisi"
        } else {
          const passwordValidation = validatePassword(formData.password)
          if (!passwordValidation.isValid) {
            newErrors.password = passwordValidation.errors.join(", ")
          }
        }
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = "Konfirmasi password wajib diisi"
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Password ga cocok"
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePassword = (password: string) => {
    const errors: string[] = []
    if (!password) {
      return { isValid: false, errors: ["Password wajib diisi"] }
    }
    if (password.length < 8) {
      errors.push("Minimal 8 karakter")
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Huruf kecil")
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Huruf besar")
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Angka")
    }
    // Gunakan regex yang sama dengan backend: karakter selain huruf dan angka
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push("Simbol (seperti: !@#$%^&*()_+-=)")
    }
    return { isValid: errors.length === 0, errors }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setIsAnimating(true)
      // Clear semua errors saat kembali
      setErrors({})
      setTimeout(() => {
        setCurrentStep((prev) => prev - 1)
        setIsAnimating(false)
      }, 200)
    }
  }

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return
    }

    // Jika step 2 (email), request OTP dulu lalu redirect ke OTP verify
    if (currentStep === 2) {
      try {
        const response = await userAuthApi.requestOTP(formData.email.trim().toLowerCase())
        if (response.success) {
          // Simpan OTP ke localStorage untuk ditampilkan di halaman verify-otp (development mode)
          if (response.data && 'otp_code' in response.data && typeof response.data.otp_code === 'string') {
            localStorage.setItem('dev_otp', response.data.otp_code)
          }
          router.push(`/users/auth/verify-otp?email=${encodeURIComponent(formData.email.trim().toLowerCase())}&returnTo=register`)
        } else {
          toast.error(response.message || "Gagal mengirim OTP")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Gagal mengirim OTP"
        toast.error(errorMessage)
      }
      return
    }

    if (currentStep < TOTAL_STEPS) {
      setIsAnimating(true)
      // Clear semua errors saat pindah step ke depan
      setErrors({})
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1)
        setIsAnimating(false)
      }, 200)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleNext()
    }
  }

  const handleSubmit = async () => {
    // Validasi step 5 dulu
    if (!validateStep(5)) {
      return
    }

    // Validasi step-step sebelumnya untuk memastikan semua data lengkap
    // Jika ada yang kosong, navigasi ke step tersebut
    if (!formData.nama.trim() || formData.nama.trim().length < 2) {
      setCurrentStep(1)
      validateStep(1)
      return
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setCurrentStep(2)
      validateStep(2)
      return
    }
    if (!formData.fakultas_id || !formData.prodi_id) {
      setCurrentStep(3)
      validateStep(3)
      return
    }
    if (!formData.nomor_induk_mahasiswa.trim() || formData.nomor_induk_mahasiswa.trim().length < 5) {
      setCurrentStep(4)
      validateStep(4)
      return
    }

    setLoading(true)
    try {
      const response = await userAuthApi.register({
        nama: formData.nama.trim(),
        email: formData.email.trim().toLowerCase(),
        fakultas_id: formData.fakultas_id,
        prodi_id: formData.prodi_id,
        nomor_induk_mahasiswa: formData.nomor_induk_mahasiswa.trim().toUpperCase(),
        password: formData.password,
      })

      if (response.success && response.data) {
        const data = response.data as { token?: string; user?: Record<string, unknown> }
        if (data.token) {
          localStorage.setItem("user_token", data.token)
        }
        if (data.user) {
          localStorage.setItem("user_data", JSON.stringify(data.user))
        }

        // Fetch complete user data from backend to get fakultas and prodi populated
        try {
          const profileResponse = await userAuthApi.getProfile()
          if (profileResponse.success && profileResponse.data) {
            localStorage.setItem("user_data", JSON.stringify(profileResponse.data))
          }
        } catch (error) {
          // If profile fetch fails, continue with data from registration
          console.error("Failed to fetch user profile:", error)
        }

        // Clear register form data from localStorage after successful registration
        localStorage.removeItem('register_form_data')

        toast.success("Daftar berhasil!")
        router.push("/users/dashboard")
      } else {
        // Handle validation errors from backend
        let errorMessage = response.message || "Gagal daftar"
        const newErrors: Record<string, string> = {}

        // Jika ada validation errors dari backend, tampilkan yang lebih detail
        if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
          // Map errors ke field-specific errors
          response.errors.forEach((err: { msg?: string; message?: string; param?: string } | string) => {
            if (typeof err === 'string') {
              errorMessage = err
            } else {
              const field = err.param || 'submit'
              const message = err.msg || err.message || 'Validation error'
              newErrors[field] = message
              if (!err.param) {
                errorMessage = message
              }
            }
          })

          const passwordErrors = []
          if (newErrors.password) passwordErrors.push(newErrors.password)
          if (newErrors.confirmPassword) passwordErrors.push(newErrors.confirmPassword)

          if (passwordErrors.length > 0) {
            errorMessage = passwordErrors.join(', ')
          } else {
            // Hanya ambil error yang relevan dengan password atau general error
            // Jangan ambil error dari field lain seperti nama, email, dll
            const allErrors = Object.values(newErrors).filter(Boolean)
            // Filter hanya error password atau error umum yang tidak spesifik ke field lain
            const filteredErrors = allErrors.filter(err => {
              const errStr = typeof err === 'string' ? err.toLowerCase() : ''
              return errStr.includes('password') || 
                     errStr.includes('validasi') ||
                     (!errStr.includes('nama') && !errStr.includes('email') && !errStr.includes('fakultas') && !errStr.includes('prodi') && !errStr.includes('nim'))
            })
            
            if (filteredErrors.length > 0) {
              errorMessage = filteredErrors[0] // Ambil error pertama yang relevan
            } else if (allErrors.length > 0) {
              errorMessage = allErrors[0] // Fallback ke error pertama
            }
          }
        }

        toast.error(errorMessage)

        // Set errors - HANYA untuk field password yang relevan dengan step saat ini (step 5)
        // Jangan simpan error dari field lain (nama, email, dll) karena itu sudah divalidasi di step sebelumnya
        const relevantErrors: Record<string, string> = {}
        
        // Hanya ambil error yang relevan dengan password - IGNORE semua error lain
        if (newErrors.password) {
          relevantErrors.password = newErrors.password
        }
        if (newErrors.confirmPassword) {
          relevantErrors.confirmPassword = newErrors.confirmPassword
        }
        
        // Jika error message mengandung 'password', set sebagai password error
        if (errorMessage.toLowerCase().includes('password')) {
          relevantErrors.password = errorMessage
        }
        
        // HANYA set error yang relevan dengan step saat ini (step 5 = password)
        // JANGAN simpan error dari field lain seperti nama, email, fakultas, prodi, nim
        // Clear semua error yang tidak relevan terlebih dahulu
        setErrors({})
        
        if (Object.keys(relevantErrors).length > 0) {
          setErrors(relevantErrors)
        } else if (currentStep === 5) {
          // Hanya set submit error di step 5, dan hanya jika error message berhubungan dengan password
          if (errorMessage.toLowerCase().includes('password') || 
              errorMessage.toLowerCase().includes('validasi') ||
              errorMessage.toLowerCase().includes('gagal')) {
            setErrors({ submit: errorMessage })
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ada error nih"
      toast.error(errorMessage)
      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="space-y-3 text-left">
              <p className="text-sm text-gray-400">Hai 👋, Kenalin diri kamu dulu yaaa</p>
              <h2 className="text-3xl font-semibold text-white leading-tight">Siapa Nama kamu?</h2>
            </div>
            <div className="space-y-3 max-w-md">
              <Input
                ref={inputRef}
                id="nama"
                placeholder="Masukan nama lengkap kamu"
                value={formData.nama}
                onChange={(e) => {
                  setFormData({ ...formData, nama: e.target.value })
                  if (errors.nama) setErrors({ ...errors, nama: "" })
                }}
                onKeyPress={handleKeyPress}
                className="h-12 text-base rounded-full border-2 border-gray-700 bg-gray-900/50 text-white placeholder:text-gray-500 focus:border-gray-500 focus:ring-0"
                aria-invalid={!!errors.nama}
              />
              {errors.nama && (
                <p className="text-sm text-red-400">{errors.nama}</p>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8">
            <div className="space-y-3 text-left">
              <h2 className="text-3xl font-semibold text-white leading-tight">Daftarin Email kamu dulu yaaa !</h2>
            </div>
            <div className="space-y-3 max-w-md">
              <Input
                ref={inputRef}
                id="email"
                type="email"
                placeholder="Masukin Email Aktif Kamu"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  if (errors.email) setErrors({ ...errors, email: "" })
                }}
                onKeyPress={handleKeyPress}
                className="h-12 text-base rounded-full border-2 border-gray-700 bg-gray-900/50 text-white placeholder:text-gray-500 focus:border-gray-500 focus:ring-0"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email}</p>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-8">
            <div className="space-y-3 text-left">
              <h2 className="text-3xl font-semibold text-white leading-tight">Kamu dari Prodi dan Fakultas apa?</h2>
            </div>
            <div className="space-y-4 max-w-md">
              <div className="space-y-3">
                <Select
                  value={formData.fakultas_id}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      fakultas_id: value,
                      prodi_id: "",
                    })
                    if (errors.fakultas_id) setErrors({ ...errors, fakultas_id: "" })
                  }}
                >
                  <SelectTrigger
                    className="h-12 text-base rounded-full border-2 border-gray-700 bg-gray-900/50 text-white placeholder:text-gray-500 focus:border-gray-500 focus:ring-0"
                    aria-invalid={!!errors.fakultas_id}
                  >
                    <SelectValue placeholder="Pilih Fakultas" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {fakultas.map((fak) => (
                      <SelectItem key={fak._id} value={fak._id} className="text-white focus:bg-gray-800">
                        {fak.nama} ({fak.kode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fakultas_id && (
                  <p className="text-sm text-red-400">{errors.fakultas_id}</p>
                )}
              </div>

              <div className="space-y-3">
                <Select
                  value={formData.prodi_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, prodi_id: value })
                    if (errors.prodi_id) setErrors({ ...errors, prodi_id: "" })
                  }}
                  disabled={!formData.fakultas_id || loadingProdi}
                >
                  <SelectTrigger
                    className="h-12 text-base rounded-full border-2 border-gray-700 bg-gray-900/50 text-white placeholder:text-gray-500 focus:border-gray-500 focus:ring-0 disabled:opacity-50"
                    aria-invalid={!!errors.prodi_id}
                  >
                    <SelectValue
                      placeholder={
                        !formData.fakultas_id
                          ? "Pilih fakultas dulu"
                          : loadingProdi
                            ? "Loading..."
                            : "Pilih Prodi"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {prodi.map((p) => (
                      <SelectItem key={p._id} value={p._id} className="text-white focus:bg-gray-800">
                        {p.nama} ({p.kode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.prodi_id && (
                  <p className="text-sm text-red-400">{errors.prodi_id}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-8">
            <div className="space-y-3 text-left">
              <h2 className="text-3xl font-semibold text-white leading-tight">NIM kamu berapa ?</h2>
            </div>
            <div className="space-y-3 max-w-md">
              <Input
                ref={inputRef}
                id="nim"
                placeholder="Masukan Nomor induk mahasiswa kamu"
                value={formData.nomor_induk_mahasiswa}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    nomor_induk_mahasiswa: e.target.value.replace(/\s/g, ""),
                  })
                  if (errors.nomor_induk_mahasiswa)
                    setErrors({ ...errors, nomor_induk_mahasiswa: "" })
                }}
                onKeyPress={handleKeyPress}
                className="h-12 text-base rounded-full border-2 border-gray-700 bg-gray-900/50 text-white placeholder:text-gray-500 focus:border-gray-500 focus:ring-0"
                aria-invalid={!!errors.nomor_induk_mahasiswa}
              />
              {errors.nomor_induk_mahasiswa && (
                <p className="text-sm text-red-400">{errors.nomor_induk_mahasiswa}</p>
              )}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-8">
            <div className="space-y-3 text-left">
              <h2 className="text-3xl font-semibold text-white leading-tight">Sekarang buat Password akun mu</h2>
            </div>
            <div className="space-y-4 max-w-md">
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password Kamu"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value })
                      if (errors.password) setErrors({ ...errors, password: "" })
                    }}
                    className="h-12 text-base rounded-full border-2 border-gray-700 bg-gray-900/50 text-white placeholder:text-gray-500 focus:border-gray-500 focus:ring-0 pr-12"
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div className="space-y-1">
                    <p className="text-sm text-red-400">{errors.password}</p>
                    <p className="text-xs text-gray-400">
                      Password harus mengandung: minimal 8 karakter, huruf besar, huruf kecil, angka, dan simbol (contoh: !@#$%^&*)
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ketik Ulang Password Kamu"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value })
                      if (errors.confirmPassword)
                        setErrors({ ...errors, confirmPassword: "" })
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                    className="h-12 text-base rounded-full border-2 border-gray-700 bg-gray-900/50 text-white placeholder:text-gray-500 focus:border-gray-500 focus:ring-0 pr-12"
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const progress = (currentStep / TOTAL_STEPS) * 100

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

        {/* Login Button (hanya di step 1) atau Back Button (step > 1) */}
        <div className="mb-8">
          {currentStep === 1 ? (
            <button
              onClick={() => router.push("/users/login")}
              className="text-white text-base hover:text-gray-300 transition-colors"
            >
              Login
            </button>
          ) : (
            <button
              onClick={handleBack}
              disabled={loading || isAnimating}
              className="text-white text-base hover:text-gray-300 disabled:opacity-50 transition-colors"
            >
              Kembali
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="mb-16">
          <div
            className={cn(
              "transition-all duration-300 ease-in-out",
              isAnimating
                ? "opacity-0 translate-x-4"
                : "opacity-100 translate-x-0"
            )}
          >
            {renderStepContent()}
          </div>
        </div>

        {/* Error box hanya untuk error submit yang relevan dengan step saat ini */}
        {errors.submit && currentStep === 5 && !errors.password && !errors.confirmPassword && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/20 text-sm text-red-400 max-w-md">
            {errors.submit}
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end max-w-md">
          {currentStep < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={loading || isAnimating}
              className="text-white text-base px-0 py-2 disabled:opacity-50 hover:text-gray-300 transition-colors flex items-center gap-2"
            >
              {currentStep === 2 ? (
                "Verifikasi Email"
              ) : (
                <>
                  Selanjutnya
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="text-white text-base px-0 py-2 disabled:opacity-50 hover:text-gray-300 transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Daftar...
                </span>
              ) : (
                "Konfirmasi"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
