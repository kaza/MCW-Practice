import type React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ChevronDown, Settings } from "lucide-react"

export const CalendarHeader: React.FC = () => {
  return (
    <header className="border-b p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost">Today</Button>
        <h2 className="text-lg font-semibold">Oct 2025</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex border rounded-lg">
          <Button variant="ghost" className="rounded-r-none">
            Day
          </Button>
          <Separator orientation="vertical" />
          <Button variant="ghost" className="rounded-none bg-emerald-50">
            Week
          </Button>
          <Separator orientation="vertical" />
          <Button variant="ghost" className="rounded-l-none">
            Month
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              Color: Status
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Available</DropdownMenuItem>
              <DropdownMenuItem>Busy</DropdownMenuItem>
              <DropdownMenuItem>Away</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>

        <Avatar>
          <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MCW_Design_File-mxU5Flus7fWjN7ZKABOCy9HgIHTYRP.png" />
          <AvatarFallback>TM</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}

