import type React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ClientSelectorProps {
  appointmentDate: string
  onCreateClient: () => void
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({ appointmentDate, onCreateClient }) => {
  return (
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
      <Button
        variant="ghost"
        className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50"
        onClick={onCreateClient}
      >
        + Create client
      </Button>
    </div>
  )
}

