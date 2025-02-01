import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch" // Import the Switch component

interface CreateClientFormProps {
  appointmentDate: string
  onClose: () => void
}

export const CreateClientForm: React.FC<CreateClientFormProps> = ({ appointmentDate, onClose }) => {
  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-background shadow-lg border-l animate-in slide-in-from-right">
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">Create client</h2>
            <p className="text-sm text-muted-foreground">Appointment: {appointmentDate}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <RadioGroup defaultValue="adult" className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="adult" id="adult" />
                <Label htmlFor="adult">Adult</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minor" id="minor" />
                <Label htmlFor="minor">Minor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="couple" id="couple" />
                <Label htmlFor="couple">Couple</Label>
              </div>
            </RadioGroup>

            <div className="flex justify-end">
              <div className="flex items-center space-x-2">
                <Checkbox id="waitlist" />
                <Label htmlFor="waitlist">Add to waitlist</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Legal first name</Label>
              <Input id="firstName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Legal last name</Label>
              <Input id="lastName" />
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Contact details</h3>
              <p className="text-sm text-muted-foreground">
                Manage contact info for reminders and notifications. An email is needed for granting Client Portal
                access.
              </p>
            </div>
            <Button variant="outline" className="w-full justify-start text-emerald-600">
              + Add email
            </Button>
            <Button variant="outline" className="w-full justify-start text-emerald-600">
              + Add phone
            </Button>
          </div>

          {/* Reminder Options */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-4">Reminder and notification options</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Upcoming appointments</Label>
                  <div className="flex items-center gap-2">
                    <Switch />
                    <Button variant="link" className="text-blue-500 h-auto p-0">
                      Manage
                    </Button>
                  </div>
                </div>
                <div className="pl-4 space-y-2">
                  <div className="text-sm">example@email.com</div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">No phone</div>
                    <RadioGroup defaultValue="text" className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="text" id="text" />
                        <Label htmlFor="text">Text</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="voice" id="voice" />
                        <Label htmlFor="voice">Voice</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Incomplete documents</Label>
                  <div className="flex items-center gap-2">
                    <Switch />
                    <Button variant="link" className="text-blue-500 h-auto p-0">
                      Manage
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Cancellations</Label>
                  <div className="flex items-center gap-2">
                    <Switch />
                    <Button variant="link" className="text-blue-500 h-auto p-0">
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Type */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Billing type</h3>
              <p className="text-sm text-muted-foreground">
                How this client will typically be paying for their services.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm mb-2">For individual appointments</div>
                <RadioGroup defaultValue="self-pay" className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="self-pay" id="self-pay-individual" />
                    <Label htmlFor="self-pay-individual">Self-pay</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="insurance" id="insurance-individual" />
                    <Label htmlFor="insurance-individual">Insurance</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <div className="text-sm mb-2">For group appointments</div>
                <RadioGroup defaultValue="self-pay" className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="self-pay" id="self-pay-group" />
                    <Label htmlFor="self-pay-group">Self-pay</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="insurance" id="insurance-group" />
                    <Label htmlFor="insurance-group">Insurance</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Clinician and Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary clinician</Label>
              <Select defaultValue="travis">
                <SelectTrigger>
                  <SelectValue placeholder="Select clinician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travis">Travis McNulty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select defaultValue="stpete">
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stpete">Saint Petersburg McNulty Counseling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="border-t p-6 flex justify-end">
          <Button className="bg-emerald-600 hover:bg-emerald-700">Continue</Button>
        </div>
      </div>
    </div>
  )
}

