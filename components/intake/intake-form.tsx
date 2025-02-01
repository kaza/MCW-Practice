import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ProgressSteps } from "./progress-steps"
import { DocumentSection } from "./document-section"
import { RemindersDialog } from "./reminders-dialog"
import { ComposeEmail } from "./compose-email"
import { AlertCircle } from "lucide-react"
import { ReviewAndSend } from "./review-and-send"

interface IntakeFormProps {
  clientName: string
  clientEmail: string
  onClose: () => void
}

export const IntakeForm: React.FC<IntakeFormProps> = ({ clientName, clientEmail, onClose }) => {
  const [showReminders, setShowReminders] = useState(true)
  const [currentStep, setCurrentStep] = useState<"documents" | "email" | "review">("documents")

  const steps = [
    { number: 1, label: "Almir K.", isActive: currentStep === "documents" },
    { number: 2, label: "Compose Email", isActive: currentStep === "email" },
    { number: 3, label: "Review & Send", isActive: currentStep === "review" },
  ]

  if (currentStep === "review") {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <ReviewAndSend clientName={clientName} onBack={() => setCurrentStep("email")} onComplete={onClose} />
      </div>
    )
  }

  if (currentStep === "email") {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <ComposeEmail
          clientName={clientName}
          onBack={() => setCurrentStep("documents")}
          onContinue={() => setCurrentStep("review")}
        />
      </div>
    )
  }

  const consentDocuments = [
    { id: "auth", label: "(NICOLE) AUTHORIZATION FOR USE OR DISCLOSURE" },
    { id: "adult-consent", label: "Adult Informed Consent for Psychiatric Services" },
    { id: "telehealth", label: "Consent for Telehealth Consultation" },
    { id: "credit-card", label: "Credit Card Authorization", checked: true },
    { id: "group-therapy", label: "Group Therapy Consent" },
    { id: "life-coaching", label: "Informed Consent for Life Coaching" },
    { id: "psychotherapy", label: "Informed Consent for Psychotherapy", checked: true },
    { id: "minor-consent", label: "Minor Informed Consent for Psychiatric Services" },
    { id: "privacy", label: "Notice of Privacy Practices", checked: true },
    { id: "policies", label: "Practice Policies", checked: true },
    { id: "termination", label: "Termination of Treatment" },
  ]

  const scoredMeasures = [
    { id: "gad-7", label: "GAD-7", checked: true, frequency: true },
    { id: "phq-9", label: "PHQ-9", checked: true },
  ]

  const questionnaires = [
    { id: "adult-eval", label: "Adult Psychiatric Evaluation Intake Form (18+)" },
    { id: "couples", label: "Couples Counseling Initial Intake Form" },
    { id: "dissociative", label: "Dissociative Experiences Scale (DES-II)" },
    { id: "adult-intake", label: "MCW Adult Intake Questionnaire (18+)", checked: true },
    { id: "minor-intake", label: "MCW Minor Intake Questionnaire (0 - 17)" },
    { id: "release", label: "Release of Information - Short" },
    { id: "standard-es", label: "Standard Intake Questionnaire - En Español" },
  ]

  const demographicsForms = [
    { id: "credit-info", label: "Credit card information", checked: true },
    { id: "demographics", label: "Demographics form", checked: true },
  ]

  const uploadedFiles = [
    { id: "release-auth", label: "Authorization for Release of Information" },
    { id: "bai", label: "BAI" },
    { id: "bdi", label: "BDI" },
  ]

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-6">Send intakes for {clientName}</h2>

        <ProgressSteps steps={steps} />

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <span>{clientName} will receive Client Portal access.</span>
        </div>

        <div className="mb-6">
          <div className="text-sm mb-2">
            {clientName} • {clientEmail}
          </div>
          <h3 className="text-lg font-medium mb-4">{clientName}'s items</h3>

          <div className="space-y-8">
            <DocumentSection title="Consent Documents" items={consentDocuments} />
            <DocumentSection title="Scored measures" items={scoredMeasures} />
            <DocumentSection title="Questionnaires" items={questionnaires} />
            <DocumentSection title="Demographics and Credit Card Forms" items={demographicsForms} />
            <DocumentSection title="Uploaded Files" items={uploadedFiles} />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCurrentStep("email")}>
            Continue to Email
          </Button>
        </div>

        <RemindersDialog
          isOpen={showReminders}
          onClose={() => setShowReminders(false)}
          clientName={clientName}
          clientEmail={clientEmail}
        />
      </div>
    </div>
  )
}

