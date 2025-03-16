"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ModeToggle } from "@/components/mode-toggle"

interface PageHeaderProps {
  title: string
  step: number
  totalSteps: number
  onBack?: () => void
}

export function PageHeader({ title, step, totalSteps, onBack }: PageHeaderProps) {
  const progress = (step / totalSteps) * 100

  return (
    <div className="mb-6 space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <ModeToggle />
      </div>

      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">
          Step {step} of {totalSteps}
        </p>
      </div>
    </div>
  )
}

