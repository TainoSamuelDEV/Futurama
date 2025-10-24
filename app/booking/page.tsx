import { createClient } from "@/lib/supabase/server"
import BookingFlow from "@/components/booking-flow"

export default async function BookingPage() {
  const supabase = await createClient()

  // Fetch services for the booking flow
  const { data: services } = await supabase.from("services").select("*").eq("is_active", true).order("price")

  const { data: barbers } = await supabase.from("barbers").select("*").eq("is_active", true).order("name")

  // Fetch time slots
  const { data: dates } = await supabase.from("dates").select("*").eq("is_available", true).order("date")

  return (
    <div className="min-h-screen bg-black text-white">
      <BookingFlow services={services || []} dates={dates || []} barbers={barbers || []} />
    </div>
  )
}
