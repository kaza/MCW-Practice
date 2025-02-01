import type React from "react"
import { SidebarItem } from "./sidebar-item"
import {
  Activity,
  AlertCircle,
  BarChart2,
  Calendar,
  CreditCard,
  Eye,
  Heart,
  Mail,
  Megaphone,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

interface SidebarItemData {
  icon: LucideIcon
  label: string
  badge?: string
}

const sidebarItems: SidebarItemData[] = [
  { icon: Calendar, label: "Calendar" },
  { icon: Users, label: "Clients" },
  { icon: CreditCard, label: "Billing" },
  { icon: Heart, label: "Insurance" },
  { icon: BarChart2, label: "Analytics" },
  { icon: Activity, label: "Activity" },
  { icon: Eye, label: "Supervision" },
  { icon: Settings, label: "Settings" },
  { icon: AlertCircle, label: "Reminders", badge: "95+" },
  { icon: Mail, label: "Requests" },
  { icon: Megaphone, label: "Marketing" },
]

export const MainSidebar: React.FC = () => {
  return (
    <div className="w-60 border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-emerald-700">MCW</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {sidebarItems.map((item) => (
          <SidebarItem key={item.label} icon={item.icon} label={item.label} badge={item.badge} />
        ))}
      </nav>
    </div>
  )
}

