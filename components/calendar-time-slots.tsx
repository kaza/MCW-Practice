import type React from "react"

interface CalendarTimeSlotsProps {
  timeSlots: string[]
}

export const CalendarTimeSlots: React.FC<CalendarTimeSlotsProps> = ({ timeSlots }) => {
  return (
    <div className="border-r">
      {timeSlots.map((time) => (
        <div key={time} className="h-20 px-4 text-sm text-muted-foreground flex items-center">
          {time}
        </div>
      ))}
    </div>
  )
}

