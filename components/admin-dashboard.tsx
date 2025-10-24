"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Scissors,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Booking {
  id: string
  name: string
  phone: string
  time_slot: string
  barber: string
  observation: number | null
  created_at?: string
  timeSlots?: {
    slot_start: number
    slot_size: number
    dates: {
      date: string
    }
  }
  barbers?: {
    name: string
  }
}

interface AdminDashboardProps {
  bookings: Booking[]
}

const STATUS_CONFIG = {
  pending: { label: "Pendente", color: "bg-yellow-500", icon: AlertCircle },
  confirmed: { label: "Confirmado", color: "bg-green-500", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: XCircle },
  completed: { label: "Concluído", color: "bg-blue-500", icon: CheckCircle },
}

export default function AdminDashboard({ bookings }: AdminDashboardProps) {
  const [filteredBookings, setFilteredBookings] = useState(bookings)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  // Filter bookings based on status and search term
  const filterBookings = (status: string, search: string) => {
    let filtered = bookings

    if (status !== "all") {
      filtered = filtered.filter((booking) => booking.status === status)
    }

    if (search) {
      filtered = filtered.filter(
        (booking) =>
          booking.services.name.toLowerCase().includes(search.toLowerCase()) ||
          booking.profiles.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          booking.profiles.phone?.includes(search),
      )
    }

    setFilteredBookings(filtered)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    filterBookings(status, searchTerm)
  }

  const handleSearch = (search: string) => {
    setSearchTerm(search)
    filterBookings(statusFilter, search)
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setIsUpdating(bookingId)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", bookingId)

      if (error) throw error

      // Update local state
      const updatedBookings = bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: newStatus as any } : booking,
      )

      // Re-filter with updated data
      let filtered = updatedBookings
      if (statusFilter !== "all") {
        filtered = filtered.filter((booking) => booking.status === statusFilter)
      }
      if (searchTerm) {
        filtered = filtered.filter(
          (booking) =>
            booking.services.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.profiles.phone?.includes(searchTerm),
        )
      }
      setFilteredBookings(filtered)
    } catch (error) {
      console.error("Error updating booking status:", error)
      alert("Erro ao atualizar status do agendamento")
    } finally {
      setIsUpdating(null)
    }
  }

  const getStatusCounts = () => {
    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      completed: bookings.filter((b) => b.status === "completed").length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 md:px-12 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2 text-white hover:text-[#C1FE72] transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span>Voltar</span>
        </Link>
        <div className="text-2xl font-bold">
          <span className="text-white">Admin</span>
          <span className="text-[#C1FE72]">Panel</span>
        </div>
        <div className="w-20"></div>
      </nav>

      <div className="px-6 md:px-12 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Painel <span className="text-[#C1FE72]">Administrativo</span>
            </h1>
            <p className="text-gray-400">Gerencie todos os agendamentos da barbearia</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[#C1FE72]">{statusCounts.total}</div>
                <div className="text-sm text-gray-400">Total</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">{statusCounts.pending}</div>
                <div className="text-sm text-gray-400">Pendentes</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{statusCounts.confirmed}</div>
                <div className="text-sm text-gray-400">Confirmados</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{statusCounts.cancelled}</div>
                <div className="text-sm text-gray-400">Cancelados</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">{statusCounts.completed}</div>
                <div className="text-sm text-gray-400">Concluídos</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Label htmlFor="search" className="text-gray-400 mb-2 block">
                Buscar agendamentos
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nome do cliente, telefone ou serviço..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Label className="text-gray-400 mb-2 block">Filtrar por status</Label>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="confirmed">Confirmados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => {
                const StatusIcon = STATUS_CONFIG[booking.status].icon
                return (
                  <Card key={booking.id} className="bg-gray-900 border-gray-800">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-gray-400 text-xs">Cliente</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-4 w-4 text-[#C1FE72]" />
                              <span className="text-white font-medium">
                                {booking.profiles.full_name || "Nome não informado"}
                              </span>
                            </div>
                            {booking.profiles.phone && (
                              <div className="flex items-center gap-2 mt-1">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-400 text-sm">{booking.profiles.phone}</span>
                              </div>
                            )}
                          </div>

                          <div>
                            <Label className="text-gray-400 text-xs">Serviço</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Scissors className="h-4 w-4 text-[#C1FE72]" />
                              <span className="text-white font-medium">{booking.services.name}</span>
                            </div>
                            <div className="text-[#C1FE72] font-bold text-sm">
                              R$ {booking.services.price.toFixed(2).replace(".", ",")}
                            </div>
                          </div>

                          <div>
                            <Label className="text-gray-400 text-xs">Data e Hora</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-4 w-4 text-[#C1FE72]" />
                              <span className="text-white">
                                {new Date(booking.booking_date).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-400 text-sm">{booking.booking_time.slice(0, 5)}</span>
                            </div>
                          </div>

                          <div>
                            <Label className="text-gray-400 text-xs">Status</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG[booking.status].color}`}></div>
                              <span className="text-white font-medium">{STATUS_CONFIG[booking.status].label}</span>
                            </div>
                            {booking.notes && <p className="text-gray-400 text-sm mt-1 italic">"{booking.notes}"</p>}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {booking.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, "confirmed")}
                                disabled={isUpdating === booking.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBookingStatus(booking.id, "cancelled")}
                                disabled={isUpdating === booking.id}
                                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                            </>
                          )}
                          {booking.status === "confirmed" && (
                            <Button
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, "completed")}
                              disabled={isUpdating === booking.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Concluir
                            </Button>
                          )}
                          {(booking.status === "cancelled" || booking.status === "completed") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.id, "pending")}
                              disabled={isUpdating === booking.id}
                              className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white"
                            >
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Reativar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-400">Nenhum agendamento encontrado</h3>
                  <p className="text-gray-500">
                    {statusFilter !== "all" || searchTerm
                      ? "Tente ajustar os filtros de busca"
                      : "Os agendamentos aparecerão aqui quando forem criados"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
