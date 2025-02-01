import type React from "react"
import { CalendarTimeSlots } from "./calendar-time-slots"

interface Day {
  date: number
  day: string
}

interface CalendarGridProps {
  days: Day[]
  timeSlots: string[]
  onTimeSlotClick: (day: Day, time: string) => void
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ days, timeSlots, onTimeSlotClick }) => {
  return (
    <div className="flex-1 grid grid-cols-[auto_1fr] overflow-auto">
      <CalendarTimeSlots timeSlots={timeSlots} />
      <div className="grid grid-cols-6">
        <div className="col-span-6 grid grid-cols-6 border-b">
          {days.map((day) => (
            <div key={day.date} className="p-4 text-center border-r last:border-r-0">
              <div className="text-sm text-muted-foreground">{day.day}</div>
              <div className="font-semibold">{day.date}</div>
            </div>
          ))}
        </div>

        {days.map((day) => (
          <div key={day.date} className="border-r last:border-r-0">
            {timeSlots.map((time) => (
              <div
                key={time}
                className="h-20 border-b last:border-b-0 cursor-pointer hover:bg-emerald-50 transition-colors"
                onClick={() => onTimeSlotClick(day, time)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

