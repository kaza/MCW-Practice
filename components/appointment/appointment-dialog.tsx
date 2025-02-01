import type React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog"
import { AppointmentTabs } from "./appointment-tabs"

interface AppointmentDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  selectedTime: string
  onCreateClient: () => void
  onDone: () => void
}

export const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  onCreateClient,
  onDone,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal={false}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <AppointmentTabs selectedDate={selectedDate} selectedTime={selectedTime} onCreateClient={onCreateClient} />
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onDone}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

