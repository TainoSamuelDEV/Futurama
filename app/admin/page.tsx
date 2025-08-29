import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminDashboard from "@/components/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch bookings with related data
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      `
      *,
      services (name, price, duration_minutes),
      profiles (full_name, phone)
    `,
    )
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminDashboard bookings={bookings || []} />
    </div>
  )
}
