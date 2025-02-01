import React from "react"

interface ProgressStep {
  number: number
  label: string
  isActive?: boolean
}

interface ProgressStepsProps {
  steps: ProgressStep[]
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps }) => {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="flex items-center gap-2">
            <div
              className={`
              w-6 h-6 rounded-full flex items-center justify-center text-sm
              ${step.isActive ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}
            `}
            >
              {step.number}
            </div>
            <span className={step.isActive ? "text-gray-900" : "text-gray-600"}>{step.label}</span>
          </div>
          {index < steps.length - 1 && <div className="h-px w-4 bg-gray-200" />}
        </React.Fragment>
      ))}
    </div>
  )
}

