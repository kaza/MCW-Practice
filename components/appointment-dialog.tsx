import type React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin } from "lucide-react"

interface AppointmentDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  selectedTime: string
}

export const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
}) => {
  const endTime = new Date(selectedDate)
  endTime.setMinutes(endTime.getMinutes() + 50)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <Tabs defaultValue="appointment" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appointment">Appointment</TabsTrigger>
              <TabsTrigger value="event">Event</TabsTrigger>
              <TabsTrigger value="out-of-office">Out of office</TabsTrigger>
            </TabsList>
            <TabsContent value="appointment" className="mt-4 space-y-4">
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 justify-start gap-2">
                  <div className="flex -space-x-2">
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MCW_Design_File-mxU5Flus7fWjN7ZKABOCy9HgIHTYRP.png" />
                      <AvatarFallback>A1</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MCW_Design_File-mxU5Flus7fWjN7ZKABOCy9HgIHTYRP.png" />
                      <AvatarFallback>A2</AvatarFallback>
                    </Avatar>
                  </div>
                  Individual or couple
                </Button>
                <Button variant="outline" className="flex-1 justify-start gap-2">
                  <div className="flex -space-x-2">
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MCW_Design_File-mxU5Flus7fWjN7ZKABOCy9HgIHTYRP.png" />
                      <AvatarFallback>G1</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MCW_Design_File-mxU5Flus7fWjN7ZKABOCy9HgIHTYRP.png" />
                      <AvatarFallback>G2</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MCW_Design_File-mxU5Flus7fWjN7ZKABOCy9HgIHTYRP.png" />
                      <AvatarFallback>G3</AvatarFallback>
                    </Avatar>
                  </div>
                  Group
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Select>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Search Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client1">John Doe</SelectItem>
                    <SelectItem value="client2">Jane Smith</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50">
                  + Create client
                </Button>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Appointment details</h4>

                <div className="flex items-center gap-2">
                  <Checkbox id="all-day" />
                  <label htmlFor="all-day" className="text-sm">
                    All day
                  </label>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="text-sm">{selectedDate.toLocaleDateString()}</div>
                  <div className="text-sm text-muted-foreground">to</div>
                  <div className="text-sm">{endTime.toLocaleDateString()}</div>

                  <div className="text-sm">{selectedTime}</div>
                  <div className="text-sm text-muted-foreground"></div>
                  <div className="text-sm">{new Date(`2000-01-01 ${selectedTime}`).getHours() + 1}:50 PM</div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>50 mins</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>Saint Petersburg McNulty Counseling and Wellness</span>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="recurring" />
                  <label htmlFor="recurring" className="text-sm">
                    Recurring
                  </label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

