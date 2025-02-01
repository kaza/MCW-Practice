import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SendingDialogProps {
  isOpen: boolean
}

export const SendingDialog: React.FC<SendingDialogProps> = ({ isOpen }) => {
  return (
    <Dialog open={isOpen} modal>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle>Sending Email Now</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          We are sending your email to your client now. This should only take a few seconds.
        </p>
      </DialogContent>
    </Dialog>
  )
}

