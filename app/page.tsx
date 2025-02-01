"use client"

import type React from "react"
import { useState } from "react"
import { MainSidebar } from "@/components/main-sidebar"
import { CalendarHeader } from "@/components/calendar-header"
import { CalendarGrid } from "@/components/calendar-grid"
import { AppointmentDialog } from "@/components/appointment/appointment-dialog"
import { CreateClientForm } from "@/components/client/create-client-form"
import { IntakeForm } from "@/components/intake/intake-form"

interface Day {
  date: number
  day: string
}

const CalendarPage: React.FC = () => {
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false)
  const [showCreateClient, setShowCreateClient] = useState(false)
  const [showIntakeForm, setShowIntakeForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>("")

  const timeSlots: string[] = ["9 am", "10 am", "11 am", "12 pm", "1 pm", "2 pm", "3 pm", "4 pm", "5 pm"]

  const days: Day[] = [
    { date: 20, day: "Sun" },
    { date: 21, day: "Mon" },
    { date: 22, day: "Tue" },
    { date: 23, day: "Wed" },
    { date: 24, day: "Thu" },
    { date: 25, day: "Fri" },
  ]

  const handleTimeSlotClick = (day: Day, time: string) => {
    const date = new Date()
    date.setDate(day.date)
    setSelectedDate(date)
    setSelectedTime(time)
    setIsAppointmentDialogOpen(true)
  }

  const handleCreateClient = () => {
    setShowCreateClient(true)
  }

  const handleAppointmentDone = () => {
    setIsAppointmentDialogOpen(false)
    setShowIntakeForm(true)
  }

  return (
    <div className="flex h-screen relative">
      <MainSidebar />
      <div className="flex-1 flex flex-col">
        <CalendarHeader />
        <CalendarGrid days={days} timeSlots={timeSlots} onTimeSlotClick={handleTimeSlotClick} />
      </div>
      <AppointmentDialog
        isOpen={isAppointmentDialogOpen}
        onClose={() => setIsAppointmentDialogOpen(false)}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onCreateClient={handleCreateClient}
        onDone={handleAppointmentDone}
      />
      {showCreateClient && (
        <CreateClientForm
          appointmentDate={`${selectedDate.toLocaleDateString()} @ ${selectedTime}`}
          onClose={() => setShowCreateClient(false)}
        />
      )}
      {showIntakeForm && (
        <IntakeForm
          clientName="Almir Kazacic" // This should be dynamically set based on the selected client
          clientEmail="almir@example.com" // This should be dynamically set based on the selected client
          onClose={() => setShowIntakeForm(false)}
        />
      )}
    </div>
  )
}

export default CalendarPage

