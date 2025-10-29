"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
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
  Edit,
  Trash2,
  Eye,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Booking {
  id: string
  name: string
  phone: string
  time_slot: string
  barber: string
  service_id?: number
  payment_status?: string
  observation?: string | null
  booked_in?: string
  // Dados relacionais que podem vir das consultas
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
  services?: {
    name: string
    price: number
  } | null
}

interface AdminDashboardProps {
  bookings: Booking[]
}

const STATUS_CONFIG = {
  NPAGO: { label: "Não Pago", color: "bg-red-500", icon: XCircle },
  METPAGO: { label: "Meio Pago", color: "bg-yellow-500", icon: AlertCircle },
  PAGO: { label: "Pago", color: "bg-green-500", icon: CheckCircle },
} as const

export default function AdminDashboard({ bookings }: AdminDashboardProps) {
  const [filteredBookings, setFilteredBookings] = useState(bookings)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [barberFilter, setBarberFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    barber: "",
    time_slot: "",
    observation: "",
  })

  // Filter bookings based on all filters
  const filterBookings = (status: string, search: string, barber?: string, date?: string) => {
    let filtered = bookings

    if (status !== "all") {
      filtered = filtered.filter((booking) => booking.payment_status === status)
    }

    if (search) {
      filtered = filtered.filter(
        (booking) =>
          booking.name.toLowerCase().includes(search.toLowerCase()) ||
          booking.phone?.includes(search) ||
          booking.barber.toLowerCase().includes(search.toLowerCase()),
      )
    }

    // Filtro por barbeiro
    const currentBarberFilter = barber || barberFilter
    if (currentBarberFilter !== "all") {
      filtered = filtered.filter((booking) => booking.barber === currentBarberFilter)
    }

    // Filtro por período
    const currentDateFilter = date || dateFilter
    if (currentDateFilter !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter((booking) => {
        if (!booking.booked_in) return true
        const bookingDate = new Date(booking.booked_in)
        
        switch (currentDateFilter) {
          case "today":
            return bookingDate >= today
          case "week":
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            return bookingDate >= weekAgo
          case "month":
            const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
            return bookingDate >= monthAgo
          default:
            return true
        }
      })
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

  const handleBarberFilter = (barber: string) => {
    setBarberFilter(barber)
    filterBookings(statusFilter, searchTerm, barber)
  }

  const handleDateFilter = (date: string) => {
    setDateFilter(date)
    filterBookings(statusFilter, searchTerm, barberFilter, date)
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setIsUpdating(bookingId)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("booking").update({ payment_status: newStatus }).eq("id", bookingId)

      if (error) throw error

      // Re-filter with updated data
      filterBookings(statusFilter, searchTerm)
    } catch (error) {
      console.error("Error updating booking status:", error)
      alert("Erro ao atualizar status do agendamento")
    } finally {
      setIsUpdating(null)
    }
  }

  const openEditModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setEditForm({
      name: booking.name,
      phone: booking.phone,
      barber: booking.barber,
      time_slot: booking.time_slot,
      observation: booking.observation || ""
    })
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setSelectedBooking(null)
    setIsEditModalOpen(false)
    setEditForm({ name: "", phone: "", barber: "", time_slot: "", observation: "" })
  }

  const updateBookingInfo = async () => {
    if (!selectedBooking) return

    setIsUpdating(selectedBooking.id)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("booking")
        .update({
          name: editForm.name,
          phone: editForm.phone,
          barber: editForm.barber,
          time_slot: editForm.time_slot,
          observation: editForm.observation
        })
        .eq("id", selectedBooking.id)

      if (error) throw error

      // Re-filter with updated data
      filterBookings(statusFilter, searchTerm)
      closeEditModal()
      alert("Agendamento atualizado com sucesso!")
    } catch (error) {
      console.error("Error updating booking info:", error)
      alert("Erro ao atualizar informações do agendamento")
    } finally {
      setIsUpdating(null)
    }
  }

  const deleteBooking = async (bookingId: string) => {
    setBookingToDelete(bookingId)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return

    setIsUpdating(bookingToDelete)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("booking").delete().eq("id", bookingToDelete)

      if (error) throw error

      // Re-filter with updated data
      filterBookings(statusFilter, searchTerm)
      setIsDeleteModalOpen(false)
      setBookingToDelete(null)
      alert("Agendamento excluído com sucesso!")
    } catch (error) {
      console.error("Error deleting booking:", error)
      alert("Erro ao excluir agendamento")
    } finally {
      setIsUpdating(null)
    }
  }

  const getStatusCounts = () => {
    return {
      total: bookings.length,
      NPAGO: bookings.filter((b) => b.payment_status === "NPAGO").length,
      METPAGO: bookings.filter((b) => b.payment_status === "METPAGO").length,
      PAGO: bookings.filter((b) => b.payment_status === "PAGO").length,
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[#C1FE72]">{statusCounts.total}</div>
                <div className="text-sm text-gray-400">Total de Agendamentos</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{statusCounts.NPAGO}</div>
                <div className="text-sm text-gray-400">Não Pago</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">{statusCounts.METPAGO}</div>
                <div className="text-sm text-gray-400">Meio Pago</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{statusCounts.PAGO}</div>
                <div className="text-sm text-gray-400">Pago</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">
                  R$ {bookings
                    .filter(b => b.payment_status === "PAGO" && b.services)
                    .reduce((sum, b) => sum + (b.services?.price || 0), 0)
                    .toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">Receita Total</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros Avançados */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div>
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
            <div>
              <Label className="text-gray-400 mb-2 block">Filtrar por status</Label>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="NPAGO">Não Pago</SelectItem>
                  <SelectItem value="METPAGO">Meio Pago</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">Filtrar por barbeiro</Label>
              <Select value={barberFilter} onValueChange={handleBarberFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <Scissors className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todos os Barbeiros" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Todos os Barbeiros</SelectItem>
                  {Array.from(new Set(bookings.map(b => b.barber))).map(barber => (
                    <SelectItem key={barber} value={barber}>{barber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">Filtrar por período</Label>
              <Select value={dateFilter} onValueChange={handleDateFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todos os Períodos" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Todos os Períodos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => {
                const statusKey = (booking.payment_status || 'NPAGO') as keyof typeof STATUS_CONFIG
                const StatusIcon = STATUS_CONFIG[statusKey].icon
                return (
                  <Card key={booking.id} className="bg-gray-900 border-gray-800">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                          <div>
                              <Label className="text-gray-400 text-xs">Cliente</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <User className="h-4 w-4 text-[#C1FE72]" />
                                <span className="text-white font-medium">
                                  {booking.name || "Nome não informado"}
                                </span>
                              </div>
                              {booking.phone && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Phone className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-400 text-sm">{booking.phone}</span>
                                </div>
                              )}
                              {booking.booked_in && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Calendar className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-400 text-sm">
                                    {new Date(booking.booked_in).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-400 text-xs">Barbeiro</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Scissors className="h-4 w-4 text-[#C1FE72]" />
                                <span className="text-white font-medium">{booking.barber}</span>
                              </div>
                            </div>

                            <div>
                              <Label className="text-gray-400 text-xs">Horário</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-4 w-4 text-[#C1FE72]" />
                                <span className="text-white">
                                  {booking.time_slot}
                                </span>
                              </div>
                            </div>

                            {booking.services && (
                              <div>
                                <Label className="text-gray-400 text-xs">Serviço</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <Calendar className="h-4 w-4 text-[#C1FE72]" />
                                  <span className="text-white font-medium">{booking.services.name}</span>
                                </div>
                                <div className="text-gray-400 text-sm mt-1">
                                  R$ {booking.services.price.toFixed(2)}
                                </div>
                              </div>
                            )}

                          <div>
                              <Label className="text-gray-400 text-xs">Status</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG[statusKey].color}`}></div>
                                <span className="text-white font-medium">{STATUS_CONFIG[statusKey].label}</span>
                            </div>
                            {booking.observation && <p className="text-gray-400 text-sm mt-1 italic">Obs: {booking.observation}</p>}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {/* Botões de Status */}
                          {booking.payment_status === "NPAGO" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, "METPAGO")}
                                disabled={isUpdating === booking.id}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                              >
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Meio Pago
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, "PAGO")}
                                disabled={isUpdating === booking.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Pago
                              </Button>
                            </>
                          )}
                          {booking.payment_status === "METPAGO" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, "PAGO")}
                                disabled={isUpdating === booking.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Completar Pagamento
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBookingStatus(booking.id, "NPAGO")}
                                disabled={isUpdating === booking.id}
                                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reverter
                              </Button>
                            </>
                          )}
                          {booking.payment_status === "PAGO" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.id, "METPAGO")}
                              disabled={isUpdating === booking.id}
                              className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
                            >
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Reverter para Meio Pago
                            </Button>
                          )}
                          
                          {/* Botões de Ação */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(booking)}
                            disabled={isUpdating === booking.id}
                            className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteBooking(booking.id)}
                            disabled={isUpdating === booking.id}
                            className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
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

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Telefone do cliente"
              />
            </div>
            <div>
              <Label htmlFor="edit-barber">Barbeiro</Label>
              <Input
                id="edit-barber"
                value={editForm.barber}
                onChange={(e) => setEditForm({ ...editForm, barber: e.target.value })}
                placeholder="Nome do barbeiro"
              />
            </div>
            <div>
              <Label htmlFor="edit-time-slot">Horário</Label>
              <Input
                id="edit-time-slot"
                value={editForm.time_slot}
                onChange={(e) => setEditForm({ ...editForm, time_slot: e.target.value })}
                placeholder="Horário do agendamento"
              />
            </div>
            <div>
              <Label htmlFor="edit-observation">Observação</Label>
              <Textarea
                id="edit-observation"
                value={editForm.observation || ""}
                onChange={(e) => setEditForm({ ...editForm, observation: e.target.value })}
                placeholder="Observações sobre o agendamento"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={updateBookingInfo} className="flex-1">
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={closeEditModal} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={confirmDeleteBooking} 
                variant="destructive" 
                className="flex-1"
              >
                Excluir
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
