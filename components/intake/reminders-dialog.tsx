import type React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface RemindersDialogProps {
  isOpen: boolean
  onClose: () => void
  clientName: string
  clientEmail: string
}

export const RemindersDialog: React.FC<RemindersDialogProps> = ({ isOpen, onClose, clientName, clientEmail }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send appointment reminders</DialogTitle>
          <DialogDescription>You made changes to this appointment. Would you like to send reminders?</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-span-1">{clientName}</div>
            <div className="col-span-3 flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="email" checked />
                <label htmlFor="email">Email</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="text" />
                <label htmlFor="text">Text</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="voice" />
                <label htmlFor="voice">Voice</label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Don't send reminders
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onClose}>
            Send reminders
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

