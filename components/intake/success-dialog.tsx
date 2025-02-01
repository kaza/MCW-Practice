import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Heart } from "lucide-react"
import type React from "react" // Added import for React

interface SuccessDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} modal>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-4">
          <div className="bg-emerald-600 text-white p-8 -mt-6 -mx-6">
            <Heart className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg">The work you do makes a difference and we're grateful to be a part of it.</p>
          </div>
          <p>Your items have been sent successfully!</p>
          <DialogFooter className="sm:justify-center">
            <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700">
              Ok, got it!
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

