"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/lib/api-client"
import { toast } from "react-hot-toast"
import { Loader2, Eye, EyeOff, ArrowLeft, Mail, Lock, Code } from "lucide-react"
import Image from "next/image"
import logo from "@/public/logo.png"

// Form schemas
const emailSchema = z.object({
  email: z.string().email("Email invalide"),
})

const otpSchema = z.object({
  otp: z.string().min(4, "Le code OTP doit contenir au moins 4 caractères"),
})

const passwordSchema = z.object({
  new_password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirm_new_password: z.string().min(6, "La confirmation doit contenir au moins 6 caractères"),
}).refine((data) => data.new_password === data.confirm_new_password, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm_new_password"],
})

type EmailFormData = z.infer<typeof emailSchema>
type OtpFormData = z.infer<typeof otpSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

type ForgotPasswordStep = "email" | "otp" | "password"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<ForgotPasswordStep>("email")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [resendTimer, setResendTimer] = useState(0)

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  // OTP form
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  })

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const handleEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true)
    try {
      await authApi.requestOtp(data.email)
      setEmail(data.email)
      setStep("otp")
      toast.success("Code OTP envoyé à votre email")
      // Start resend timer
      setResendTimer(60)
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.email?.[0] || "Erreur lors de l'envoi du code OTP"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (data: OtpFormData) => {
    setOtp(data.otp)
    setStep("password")
    otpForm.reset()
  }

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true)
    try {
      await authApi.resetPassword(otp, data.new_password, data.confirm_new_password)
      toast.success("Mot de passe réinitialisé avec succès!")
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.otp?.[0] ||
        error?.response?.data?.new_password?.[0] ||
        "Erreur lors de la réinitialisation du mot de passe"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0) return

    setIsLoading(true)
    try {
      await authApi.requestOtp(email)
      toast.success("Code OTP renvoyé à votre email")
      setResendTimer(60)
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || "Erreur lors du renvoi du code OTP"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const goBack = () => {
    if (step === "email") {
      router.push("/login")
    } else if (step === "otp") {
      emailForm.reset()
      setEmail("")
      setStep("email")
    } else {
      otpForm.reset()
      setOtp("")
      setStep("otp")
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-x-hidden">
      {/* Left Side - Visual Design */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-accent to-primary/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20"></div>

        {/* Animated background elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
          <div className="mb-6 xl:mb-8">
            <Image src={logo} alt="logo" className="w-20 h-20 rounded-lg border-white/20 mb-6" />
            <h1 className="text-4xl xl:text-5xl font-bold mb-3 xl:mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              ZEFAST
            </h1>
            <p className="text-lg xl:text-xl text-white/90 max-w-md">
              Retrouvez l'accès à votre compte en quelques étapes
            </p>
          </div>

          <div className="mt-8 xl:mt-12 space-y-3 xl:space-y-4 w-full max-w-md">
            <div className="flex items-center gap-3 text-white/80 text-sm xl:text-base">
              <div className="w-2 h-2 rounded-full bg-white/60 flex-shrink-0"></div>
              <span>Processus sécurisé</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm xl:text-base">
              <div className="w-2 h-2 rounded-full bg-white/60 flex-shrink-0"></div>
              <span>Vérification par email</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm xl:text-base">
              <div className="w-2 h-2 rounded-full bg-white/60 flex-shrink-0"></div>
              <span>Nouveau mot de passe instantané</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-6 xl:p-8 bg-gradient-to-br from-background via-background to-primary/5 min-h-screen lg:min-h-0 w-full">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl">
          {/* Header with back button */}
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="rounded-lg hover:bg-muted shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-accent mb-2 sm:mb-0 lg:hidden">
                <Image src={logo} alt="logo" className="w-12 h-12 rounded-lg" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {step === "email" && "Réinitialiser"}
                {step === "otp" && "Vérifier"}
                {step === "password" && "Nouveau mot de passe"}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {step === "email" && "Entrez votre email pour recevoir un code de vérification"}
                {step === "otp" && "Entrez le code reçu dans votre email"}
                {step === "password" && "Créez votre nouveau mot de passe"}
              </p>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl">
            {/* Step indicator */}
            <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8">
              {["email", "otp", "password"].map((s, index) => (
                <div key={s} className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all ${
                      (s === "email" && (step === "email" || step === "otp" || step === "password")) ||
                      (s === "otp" && (step === "otp" || step === "password")) ||
                      (s === "password" && step === "password")
                        ? "bg-gradient-to-r from-primary to-accent text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < 2 && (
                    <div
                      className={`h-1 w-8 sm:w-12 rounded-full transition-all ${
                        (s === "email" && (step === "otp" || step === "password")) ||
                        (s === "otp" && step === "password")
                          ? "bg-gradient-to-r from-primary to-accent"
                          : "bg-muted"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            {/* Email Step */}
            {step === "email" && (
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemple@email.com"
                    {...emailForm.register("email")}
                    disabled={isLoading}
                    className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {emailForm.formState.errors.email && (
                    <p className="text-xs sm:text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      <span className="hidden sm:inline">Envoi en cours...</span>
                      <span className="sm:hidden">Envoi...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Envoyer le code
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* OTP Step */}
            {step === "otp" && (
              <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Un code de vérification a été envoyé à{" "}
                    <span className="font-semibold text-foreground">{email}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Code OTP
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    {...otpForm.register("otp")}
                    disabled={isLoading}
                    maxLength={6}
                    className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all tracking-widest text-center font-semibold"
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="text-xs sm:text-sm text-destructive">{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      <Code className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Continuer
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    {resendTimer > 0 ? (
                      <>Renvoyer dans {resendTimer}s</>
                    ) : (
                      <>
                        Pas reçu le code?{" "}
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-primary hover:underline font-semibold"
                          onClick={handleResendOtp}
                          disabled={isLoading}
                        >
                          Renvoyer
                        </Button>
                      </>
                    )}
                  </p>
                </div>
              </form>
            )}

            {/* Password Step */}
            {step === "password" && (
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="new_password" className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Nouveau mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...passwordForm.register("new_password")}
                      disabled={isLoading}
                      className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.new_password && (
                    <p className="text-xs sm:text-sm text-destructive">{passwordForm.formState.errors.new_password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_new_password" className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm_new_password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...passwordForm.register("confirm_new_password")}
                      disabled={isLoading}
                      className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.confirm_new_password && (
                    <p className="text-xs sm:text-sm text-destructive">{passwordForm.formState.errors.confirm_new_password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      <span className="hidden sm:inline">Réinitialisation...</span>
                      <span className="sm:hidden">Réinit...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Réinitialiser le mot de passe
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground text-center">
              Vous avez un compte?{" "}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}