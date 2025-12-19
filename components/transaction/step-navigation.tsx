"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface StepNavigationProps {
  currentStep: number
  totalSteps: number
  onPrevious: () => void
  onNext: () => void
  isNextDisabled?: boolean
  nextLabel?: string
  previousLabel?: string
}

export function StepNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  isNextDisabled = false,
  nextLabel = "Suivant",
  previousLabel = "Précédent"
}: StepNavigationProps) {
  return (
    <div className="flex justify-between pt-4 sm:pt-6 gap-3 sm:gap-4">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className="flex items-center gap-1 sm:gap-2 h-10 sm:h-11 text-sm sm:text-base flex-1 sm:flex-none"
      >
        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden xs:inline">{previousLabel}</span>
        <span className="xs:hidden">Préc.</span>
      </Button>

      <Button
        onClick={onNext}
        disabled={isNextDisabled}
        className="flex items-center gap-1 sm:gap-2 h-10 sm:h-11 text-sm sm:text-base flex-1 sm:flex-none"
      >
        <span className="hidden xs:inline">{nextLabel}</span>
        <span className="xs:hidden">Suiv.</span>
        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    </div>
  )
}
