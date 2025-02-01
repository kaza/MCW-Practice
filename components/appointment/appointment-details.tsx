import type React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin } from "lucide-react"

interface AppointmentDetailsProps {
  selectedDate: Date
  selectedTime: string
}

export const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({ selectedDate, selectedTime }) => {
  const endTime = new Date(selectedDate)
  endTime.setMinutes(endTime.getMinutes() + 50)

  return (
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
  )
}

