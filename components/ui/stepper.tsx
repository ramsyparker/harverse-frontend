"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface StepperProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function Stepper({ currentStep, totalSteps, className }: StepperProps) {
  return (
    <div className={cn("flex items-center justify-between w-full max-w-2xl mx-auto", className)}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1
        const isCompleted = step < currentStep
        const isCurrent = step === currentStep

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "bg-primary border-primary text-primary-foreground",
                  !isCompleted && !isCurrent && "bg-background border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{step}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium transition-colors",
                  (isCompleted || isCurrent) && "text-foreground",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}
              >
                Langkah {step}
              </span>
            </div>
            {step < totalSteps && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 transition-colors",
                  isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

