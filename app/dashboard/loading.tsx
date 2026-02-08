import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F3EE]">
      <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
    </div>
  )
}
