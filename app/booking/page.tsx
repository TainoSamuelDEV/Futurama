import { createClient } from "@/lib/supabase/server"
import BookingFlow from "@/components/booking-flow"

export default async function BookingPage() {
  const supabase = await createClient()

  // Fetch services for the booking flow
  const { data: services } = await supabase.from("services").select("*").eq("is_active", true).order("price")

  const { data: barbers } = await supabase.from("barbers").select("*").eq("is_active", true).order("name")

  // Fetch time slots
  const { data: timeSlots } = await supabase.from("time_slots").select("*").eq("is_available", true).order("start_time")

  return (
    <div className="min-h-screen bg-black text-white">
      <BookingFlow services={services || []} timeSlots={timeSlots || []} barbers={barbers || []} />
    </div>
  )
}
