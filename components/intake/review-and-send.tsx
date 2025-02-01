import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ProgressSteps } from "./progress-steps"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SendingDialog } from "./sending-dialog"
import { SuccessDialog } from "./success-dialog"

interface ReviewAndSendProps {
  clientName: string
  onBack: () => void
  onComplete: () => void
}

export const ReviewAndSend: React.FC<ReviewAndSendProps> = ({ clientName, onBack, onComplete }) => {
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const steps = [
    { number: 1, label: "Almir K." },
    { number: 2, label: "Compose Email" },
    { number: 3, label: "Review & Send", isActive: true },
  ]

  const sharedItems = [
    "Notice of Privacy Practices",
    "Informed Consent for Psychotherapy",
    "Practice Policies",
    "Credit Card Authorization",
    "MCW Adult Intake Questionnaire (18+)",
    "PHQ-9",
    "GAD-7",
    "Demographics form",
    "Credit card information",
  ]

  const handleSendNow = async () => {
    setIsSending(true)
    // Simulate sending process
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSending(false)
    setIsSuccess(true)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h2 className="text-2xl font-semibold mb-6">Send intakes for {clientName}</h2>

      <ProgressSteps steps={steps} />

      <div className="space-y-6">
        <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-4">
          Almir will receive Client Portal access.
        </div>

        <div className="bg-gray-50 border rounded-lg p-4 flex items-center justify-between">
          <span className="text-gray-600">Almir will receive an email directing them to your Client Portal</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50">
                View Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Email Preview</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="prose prose-sm">
                  <p>Hi Almir,</p>
                  <p>
                    Welcome to McNulty Counseling and Wellness. Please use the link below to access our secure Client
                    Portal and complete your intake paperwork. Paperwork must be completed at least 24 hours prior to
                    your appointment. If you are unable to complete your paperwork online, please contact our office at
                    727-344-9867.
                  </p>
                  <p>[practice_client_portal_login_link]</p>
                  <p>The address for your appointment is .</p>
                  <p>Please see below for important information about parking and access at each of our locations:</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 bg-gray-100">
              <AvatarFallback>AK</AvatarFallback>
            </Avatar>
            <h3 className="text-lg">Sharing 9 items with Almir</h3>
          </div>

          <div className="space-y-2">
            {sharedItems.map((item) => (
              <div key={item} className="flex items-center gap-2 text-gray-600">
                <Check className="h-4 w-4 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Email
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2" onClick={handleSendNow}>
            Share & Send Now
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SendingDialog isOpen={isSending} />

      <SuccessDialog
        isOpen={isSuccess}
        onClose={() => {
          setIsSuccess(false)
          onComplete()
        }}
      />
    </div>
  )
}

