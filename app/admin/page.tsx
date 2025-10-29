import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminDashboard from "@/components/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()

  // For development/testing - bypass authentication
  // Remove this in production and uncomment the authentication check below
  
  /*
  // Check if user is authenticated
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }
  */

  // Fetch bookings with related data
  const { data: bookingsData, error: bookingsError } = await supabase
    .from("booking")
    .select(
      `
      id,
      name,
      phone,
      time_slot,
      barber,
      service_id,
      payment_status,
      observation,
      booked_in,
      services (
        name,
        price
      )
    `
    )
    .order("booked_in", { ascending: false })

  console.log('Admin Page - Dados do Supabase:', { bookingsData, error: bookingsError })

  if (bookingsError) {
    console.error("Error fetching bookings:", bookingsError)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Erro ao carregar dados</h1>
          <p className="text-gray-400">Não foi possível carregar os agendamentos.</p>
          <p className="text-red-400 text-sm mt-2">Erro: {bookingsError.message}</p>
        </div>
      </div>
    )
  }

  // Garantir que os dados estão no formato correto
  const formattedBookings = (bookingsData || []).map((booking: any) => ({
    ...booking,
    id: String(booking.id), // Garantir que id é string
    payment_status: booking.payment_status || 'NPAGO', // Valor padrão
    services: booking.services || null, // Manter como objeto único ou null
  }))

  console.log('Admin Page - Dados formatados:', { 
    originalCount: bookingsData?.length || 0, 
    formattedCount: formattedBookings.length,
    sample: formattedBookings[0] 
  })

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminDashboard bookings={formattedBookings} />
    </div>
  )
}
