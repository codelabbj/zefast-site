"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, CircleCheck, Copy } from "lucide-react"
import { TransactionProgressBar } from "@/components/transaction/progress-bar"
import { StepNavigation } from "@/components/transaction/step-navigation"
import { ConfirmationDialog } from "@/components/transaction/confirmation-dialog"
import { PlatformStep } from "@/components/transaction/steps/platform-step"
import { BetIdStep } from "@/components/transaction/steps/bet-id-step"
import { NetworkStep } from "@/components/transaction/steps/network-step"
import { PhoneStep } from "@/components/transaction/steps/phone-step"
import { AmountStep } from "@/components/transaction/steps/amount-step"
import { transactionApi } from "@/lib/api-client"
import type { Platform, UserAppId, Network, UserPhone } from "@/lib/types"
import { toast } from "react-hot-toast"
import { normalizePhoneNumber } from "@/lib/utils"

// import for didier (last transaction and transaction summary dialog)
import { TransactionSummaryDialog } from "@/components/transaction/transaction-summary-dialog"
import type { Transaction } from "@/lib/types"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSettings } from "@/lib/hooks/use-settings";

export default function DepositPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { settings } = useSettings()

  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  // Après vos states existants, ajoutez :
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null)
  const [isTransactionSummaryOpen, setIsTransactionSummaryOpen] = useState(false)

  // Fetch last transaction on mount
  useEffect(() => {
    const fetchLastTransaction = async () => {
      try {
        const lastTrans = await transactionApi.getLastTransaction()
        if (lastTrans && lastTrans.status === "pending") {
          setLastTransaction(lastTrans)
          setIsTransactionSummaryOpen(true)
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la dernière transaction:", error)
      }
    }
    fetchLastTransaction()
  }, [])

  // Form data
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<UserPhone | null>(null)
  const [amount, setAmount] = useState(0)

  const [isUSSDDialogOpen, setIsUSSDDialogOpen] = useState(false)
  const [ussdCode, setUssdCode] = useState<string>("")
  const [copiedUSSD, setCopiedUSSD] = useState(false)
  // Confirmation dialog
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Transaction link modal
  const [transactionLink, setTransactionLink] = useState<string | null>(null)
  const [isTransactionLinkModalOpen, setIsTransactionLinkModalOpen] = useState(false)

  // Redirect if not authenticated
  if (!user) {
    router.push("/login")
    return null
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsConfirmationOpen(true)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }



  const handleTransactionFlow = (transaction: Transaction) => {
    if (transaction.transaction_link) {
      setTransactionLink(transaction.transaction_link)
      setIsTransactionLinkModalOpen(true)
    } else if (transaction.ussd_code) {
      setUssdCode(transaction.ussd_code)
      setIsUSSDDialogOpen(true)
      
      // Trigger dialer
      setTimeout(() => {
        window.location.href = `tel:${transaction.ussd_code}`
      }, 500)
    } else {
      router.push("/dashboard")
    }
  }

  const handleConfirmTransaction = async () => {
    if (!selectedPlatform || !selectedBetId || !selectedNetwork || !selectedPhone) {
      toast.error("Données manquantes pour la transaction")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await transactionApi.createDeposit({
        amount,
        phone_number: normalizePhoneNumber(selectedPhone.phone),
        app: selectedPlatform.id,
        user_app_id: selectedBetId.user_app_id,
        network: selectedNetwork.id,
        source: "web"
      })

      // Fermer la confirmation dialog
      setIsConfirmationOpen(false)

      handleTransactionFlow(response)
    } catch (error: any) {
      // Error already handled by interceptor
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinueTransaction = () => {
    if (transactionLink) {
      window.open(transactionLink, "_blank", "noopener,noreferrer")
      setIsTransactionLinkModalOpen(false)
      router.push("/dashboard")
    }
  }

  // Ajoutez ces deux fonctions après handleConfirmTransaction

const handleCancelTransaction = async (reference: string) => {
  await transactionApi.cancelTransaction(reference)
  setLastTransaction(null)
  setIsTransactionSummaryOpen(false)
}

const handleFinalizeTransaction = async (reference: string) => {
  try {
    const finalizedTransaction = await transactionApi.finalizeTransaction(reference)
    
    console.log("Transaction finalisée:", finalizedTransaction)
    
    setIsTransactionSummaryOpen(false)
    handleTransactionFlow(finalizedTransaction)
  } catch (error) {
    throw error
  }
}

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return selectedPlatform !== null
      case 2:
        return selectedBetId !== null
      case 3:
        return selectedNetwork !== null
      case 4:
        return selectedPhone !== null
      case 5:
        return amount > 0 && selectedPlatform &&
          amount >= selectedPlatform.minimun_deposit &&
          amount <= selectedPlatform.max_deposit
      default:
        return false
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PlatformStep
            selectedPlatform={selectedPlatform}
            onSelect={(platform) => {
              setSelectedPlatform(platform)
              setTimeout(() => { setCurrentStep(currentStep + 1) }, 1000)
            }}
            onNext={handleNext}
            type="deposit"
          />
        )
      case 2:
        return (
          <BetIdStep
            selectedPlatform={selectedPlatform}
            selectedBetId={selectedBetId}
            onSelect={(betId) => {
              setSelectedBetId(betId)
              setTimeout(() => { setCurrentStep(currentStep + 1) }, 1000)
            }}
            onNext={handleNext}
          />
        )
      case 3:
        return (
          <NetworkStep
            selectedNetwork={selectedNetwork}
            onSelect={(network) => {
              setSelectedNetwork(network)
              setTimeout(() => { setCurrentStep(currentStep + 1) }, 1000)
            }}
            type="deposit"
          />
        )
      case 4:
        return (
          <PhoneStep
            selectedNetwork={selectedNetwork}
            selectedPhone={selectedPhone}
            onSelect={(phone) => {
              setSelectedPhone(phone)
              setTimeout(() => { setCurrentStep(currentStep + 1) }, 1000)
            }}
            onNext={handleNext}
          />
        )
      case 5:
        return (
          <AmountStep
            amount={amount}
            setAmount={setAmount}
            withdriwalCode=""
            setWithdriwalCode={() => { }}
            selectedPlatform={selectedPlatform}
            selectedBetId={selectedBetId}
            selectedNetwork={selectedNetwork}
            selectedPhone={selectedPhone}
            type="deposit"
            onNext={handleNext}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl hover:bg-muted shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Effectuer un dépôt</h1>
          </div>
        </div>

        {/* Progress Bar */}
        <TransactionProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          type="deposit"
        />

        {/* Current Step */}
        <div className="min-h-[300px] sm:min-h-[400px]">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        {currentStep < 5 && (
          <StepNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            onPrevious={handlePrevious}
            onNext={handleNext}
            isNextDisabled={!isStepValid()}
          />
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          onConfirm={handleConfirmTransaction}
          transactionData={{
            amount,
            phone_number: selectedPhone?.phone || "",
            app: selectedPlatform?.id || "",
            user_app_id: selectedBetId?.user_app_id || "",
            network: selectedNetwork?.id || 0,
          }}
          type="deposit"
          platformName={selectedPlatform?.name || ""}
          networkName={selectedNetwork?.public_name || ""}
          isLoading={isSubmitting}
        />

        {/* Transaction Link Modal */}
        <Dialog open={isTransactionLinkModalOpen} onOpenChange={setIsTransactionLinkModalOpen}>
          <DialogContent className="sm:max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Continuer la transaction</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Cliquez sur continuer pour continuer la transaction
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-2">
              <Button onClick={handleContinueTransaction} className="w-full sm:w-auto h-10 sm:h-11">
                Continuer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* USSD Code Dialog */}
        <Dialog open={isUSSDDialogOpen} onOpenChange={setIsUSSDDialogOpen}>
          <DialogContent className="sm:max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CircleCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Code USSD
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base pt-2">
                Vous êtes sur un ordinateur? Veuillez copier ce code et le saisir sur votre téléphone mobile.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4">
              <div className="relative">
                <div className="bg-muted/50 p-3 sm:p-4 rounded-lg border-2 border-primary/30">
                  <code className="text-sm font-mono text-center break-all text-foreground leading-relaxed">
                    {ussdCode}
                  </code>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(ussdCode)
                    setCopiedUSSD(true)
                    setTimeout(() => setCopiedUSSD(false), 2000)
                    toast.success("Code copié!")
                  }}
                  className="absolute right-2 top-2 gap-1 sm:gap-2 h-9 w-9 sm:h-10 sm:w-10 p-0"
                >
                  {copiedUSSD ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                </Button>
              </div>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-foreground">
                    <span className="font-semibold">Instructions:</span>
                  </p>
                  <ol className="text-xs sm:text-sm text-foreground list-decimal list-inside space-y-1 ml-4">
                    <li>Copiez et composez le code USSD ci-dessus</li>
                    <li>Confirmez la transaction sur votre téléphone</li>
                  </ol>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsUSSDDialogOpen(false)
                  router.push("/dashboard")
                }}
                className="w-full sm:w-auto h-10 sm:h-11"
              >
                Fermer
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsUSSDDialogOpen(false)
                  toast.success("Dépôt initié avec succès!")
                  router.push("/dashboard")
                }}
                className="w-full sm:w-auto h-10 sm:h-11"
              >
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transaction Summary Dialog */}
        <TransactionSummaryDialog
          isOpen={isTransactionSummaryOpen}
          onClose={() => {
            setIsTransactionSummaryOpen(false)
          }}
          transaction={lastTransaction}
          onCancel={handleCancelTransaction}
          onFinalize={handleFinalizeTransaction}
          isLoading={isSubmitting}
        />

      </div>
    </div>
  )
}