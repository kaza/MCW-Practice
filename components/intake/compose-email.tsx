import type React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ProgressSteps } from "./progress-steps"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface ComposeEmailProps {
  clientName: string
  onBack: () => void
  onContinue: () => void
}

export const ComposeEmail: React.FC<ComposeEmailProps> = ({ clientName, onBack, onContinue }) => {
  const steps = [
    { number: 1, label: "Almir K." },
    { number: 2, label: "Compose Email", isActive: true },
    { number: 3, label: "Review & Send" },
  ]

  const defaultEmailContent = `Hi Almir,

Welcome to McNulty Counseling and Wellness. Please use the link below to access our secure Client Portal and complete your intake paperwork. Paperwork must be completed at least 24 hours prior to your appointment. If you are unable to complete your paperwork online, please contact our office at 727-344-9867.

[practice_client_portal_login_link]

The address for your appointment is .

Please see below for important information about parking and access at each of our locations:`

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h2 className="text-2xl font-semibold mb-6">Send intakes for {clientName}</h2>

      <ProgressSteps steps={steps} />

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 bg-gray-100">
            <AvatarFallback>AK</AvatarFallback>
          </Avatar>
          <h3 className="text-lg font-medium">Almir's email</h3>
        </div>

        <div className="border rounded-lg p-4">
          <Textarea
            className="min-h-[300px] border-0 focus-visible:ring-0 p-0 resize-none"
            defaultValue={defaultEmailContent}
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Almir
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2" onClick={onContinue}>
            Continue to Review
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

