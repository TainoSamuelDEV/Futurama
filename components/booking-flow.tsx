"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Calendar, Clock, Scissors, User, Check, CreditCard } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"


interface Service {
  required_slots: number
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
}

interface Barber {
  id: string
  name: string
  specialty: string | null
  image_url: string | null
  photo_url: string | null
  is_active: boolean
}

// Interface Dates (adicionar campos)
interface Dates {
  id: string
  date: string
  barber_id: string
  is_available: boolean
  slot_start: number
  slot_end: number
}

interface TimeSlot {
  id: string
  slot_start: number
  slot_size: number
  date_id: string
  is_occupied: boolean
  barber_id: string
}

interface BookingFlowProps {
  services: Service[]
  dates: Dates[]
  barbers: Barber[]
}

export default function BookingFlow({ services, dates, barbers }: BookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [paymentOption, setPaymentOption] = useState<"50" | "100" | "">("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const getAvailableDates = () => {
    if (!selectedBarber) return []
    return dates
      .filter((d) => d.barber_id === selectedBarber.id && d.is_available)
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const [allowedRanges, setAllowedRanges] = useState<Array<{ start: number; end: number }>>([])
  const [bookedIndices, setBookedIndices] = useState<number[]>([])
  const [availableStartTimes, setAvailableStartTimes] = useState<string[]>([])

  // Converter índice de slot (10 min) para horário (HH:MM)
  const slotIndexToTime = (idx: number) => {
    // idx representa slots de 10 minutos
    const totalMinutes = idx * 10
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0")
    const minutes = (totalMinutes % 60).toString().padStart(2, "0")
    return `${hours}:${minutes}`
  }

  // Converter horário (HH:MM) para índice de slot (10 min)
  const timeToSlotIndex = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes
    return Math.floor(totalMinutes / 10) // Converter para slots de 10 minutos
  }

  // Converter slot_start (10 min) do banco para índice de slot (10 min) da interface
  const slotStartToIndex = (slotStart: number) => {
    return slotStart // Agora ambos usam incrementos de 10 minutos
  }

  // Converter índice de slot (10 min) da interface para slot_start (10 min) do banco
  const indexToSlotStart = (index: number) => {
    return index // Agora ambos usam incrementos de 10 minutos
  }

  const buildAllowedIndices = (ranges: Array<{ start: number; end: number }>) => {
    const indices = new Set<number>()
    for (const r of ranges) {
      for (let i = r.start; i < r.end; i++) {
        indices.add(i)
      }
    }
    return indices
  }

  // Buscar horários disponíveis e ocupados em uma única consulta
  useEffect(() => {
    if (!selectedBarber || !selectedDate) {
      setAllowedRanges([])
      setBookedIndices([])
      return
    }
    
    const dateRec = dates.find((d) => d.barber_id === selectedBarber.id && d.date === selectedDate)
    if (!dateRec) {
      setAllowedRanges([])
      setBookedIndices([])
      return
    }

    const supabase = createClient()
    
    // Buscar todos os timeSlots para esta data e barbeiro
    supabase
      .from("timeSlots")
      .select("slot_start, slot_size, is_occupied")
      .eq("date_id", dateRec.id)
      .eq("barber_id", selectedBarber.id)
      .then(({ data, error }) => {
        if (error) {
          console.error("Erro ao buscar timeSlots:", { code: error.code, message: error.message })
          // Fallback para intervalo do próprio registro de `dates`
          const startIndex = slotStartToIndex(dateRec.slot_start)
          const endIndex = slotStartToIndex(dateRec.slot_end)
          setAllowedRanges(endIndex > startIndex ? [{ start: startIndex, end: endIndex }] : [])
          setBookedIndices([])
          return
        }

        // Separar slots disponíveis e ocupados
        const availableSlots = (data || []).filter(slot => !slot.is_occupied)
        const occupiedSlots = (data || []).filter(slot => slot.is_occupied)

        // Processar slots disponíveis para allowedRanges
        const ranges = availableSlots.length > 0
          ? availableSlots
              .map((r: any) => {
                const startIndex = slotStartToIndex(r.slot_start)
                const endIndex = slotStartToIndex(r.slot_start + (r.slot_size ?? 0))
                return endIndex > startIndex ? { start: startIndex, end: endIndex } : null
              })
              .filter(Boolean) as Array<{ start: number; end: number }>
          : (() => {
              // Fallback para o intervalo da data se não houver slots específicos
              const startIndex = slotStartToIndex(dateRec.slot_start)
              const endIndex = slotStartToIndex(dateRec.slot_end)
              return endIndex > startIndex ? [{ start: startIndex, end: endIndex }] : []
            })()

        // Processar slots ocupados para bookedIndices - incluindo toda a duração do serviço
        const bookedIndices: number[] = []
        occupiedSlots.forEach((slot: any) => {
          const startIndex = slotStartToIndex(slot.slot_start)
          const slotSize = slot.slot_size || 1 // Usar 1 como padrão se slot_size for null
          
          // Marcar todos os slots ocupados pela duração do serviço
          for (let i = 0; i < slotSize; i++) {
            bookedIndices.push(startIndex + i)
          }
        })

        setAllowedRanges(ranges)
        setBookedIndices(bookedIndices)

        console.log("Horários disponíveis encontrados:", availableSlots.length)
        console.log("Horários ocupados encontrados:", occupiedSlots.length)
        console.log("Slots ocupados (com duração):", bookedIndices)
        console.log("Dados dos slots ocupados:", occupiedSlots.map(s => ({ 
          slot_start: s.slot_start, 
          slot_size: s.slot_size, 
          startIndex: slotStartToIndex(s.slot_start) 
        })))
      })
  }, [selectedBarber, selectedDate, dates])

  useEffect(() => {
    if (!selectedService) {
      setAvailableStartTimes([])
      return
    }
    const required = Math.ceil(selectedService.required_slots)
    const allowedSet = buildAllowedIndices(allowedRanges)
    const bookedSet = new Set(bookedIndices)
    const result: string[] = []

    const allAllowed = Array.from(allowedSet).sort((a, b) => a - b)
    if (allAllowed.length === 0) {
      setAvailableStartTimes([])
      return
    }
    const minIdx = allAllowed[0]
    const maxIdx = allAllowed[allAllowed.length - 1]

    for (let i = minIdx; i <= maxIdx; i++) {
      let ok = true
      for (let k = 0; k < required; k++) {
        const idx = i + k
        if (!allowedSet.has(idx) || bookedSet.has(idx)) {
          ok = false
          break
        }
      }
      if (ok) {
        result.push(slotIndexToTime(i))
      }
    }

    setAvailableStartTimes(result)
  }, [allowedRanges, bookedIndices, selectedService])

  // Keep ONLY this function
  const getAvailableTimesForDate = () => {
    if (!selectedDate || !selectedBarber) return []
    return availableStartTimes.map((t) => ({ id: t, time: t }))
  }
  
  const handleBooking = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime || !customerName || !customerPhone) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      // Primeiro, encontrar o date_id correspondente
      const dateRec = dates.find((d) => d.barber_id === selectedBarber.id && d.date === selectedDate)
      if (!dateRec) {
        throw new Error("Data não encontrada")
      }

      // Converter o horário selecionado para slot_start (em slots de 10 min para o banco)
      const selectedSlotIndex = timeToSlotIndex(selectedTime)
      const slotStart = indexToSlotStart(selectedSlotIndex)
      const requiredSlots = Math.ceil(selectedService.required_slots)

      // VERIFICAÇÃO CRÍTICA: Verificar se o horário ainda está disponível
      const { data: conflictCheck } = await supabase
        .from("timeSlots")
        .select("id, is_occupied")
        .eq("barber_id", selectedBarber.id)
        .eq("date_id", dateRec.id)
        .eq("slot_start", slotStart)

      // Se existe um slot e está ocupado, bloquear o agendamento
      if (conflictCheck && conflictCheck.length > 0 && conflictCheck[0].is_occupied) {
        throw new Error("Este horário foi ocupado por outro cliente. Por favor, selecione outro horário.")
      }

      // Encontrar um timeSlot disponível ou criar um novo
      const { data: existingSlot } = await supabase
        .from("timeSlots")
        .select("id")
        .eq("barber_id", selectedBarber.id)
        .eq("date_id", dateRec.id)
        .eq("slot_start", slotStart)
        .eq("is_occupied", false)
        .single()

      let timeSlotId: string

      if (existingSlot) {
        // Marcar o slot como ocupado
        const { error: updateError } = await supabase
          .from("timeSlots")
          .update({ is_occupied: true })
          .eq("id", existingSlot.id)

        if (updateError) throw updateError
        timeSlotId = existingSlot.id
      } else {
        // Criar um novo timeSlot
        const { data: newSlot, error: slotError } = await supabase
          .from("timeSlots")
          .insert({
            slot_start: slotStart,
            slot_size: requiredSlots,
            date_id: dateRec.id,
            is_occupied: true,
            barber_id: selectedBarber.id
          })
          .select("id")
          .single()

        if (slotError) throw slotError
        timeSlotId = newSlot.id
      }

      // Criar o booking
      const { error } = await supabase.from("booking").insert({
        name: customerName,
        phone: customerPhone,
        time_slot: timeSlotId,
        barber: selectedBarber.id,
        observation: notes || null,
      })

      if (error) throw error

      router.push("/booking/success")
    } catch (error) {
      console.error("Error creating booking:", error)
      console.error("Error details:", JSON.stringify(error, null, 2))
      alert(`Erro ao criar agendamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = () => {
    // Para fins de teste, pular a etapa de pagamento
    handleBooking()
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 5))
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <nav className="flex items-center justify-between p-4 md:p-6 md:px-12">
        <Link href="/" className="flex items-center gap-2 text-white hover:text-[#C1FE72] transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span>Sair  </span>
        </Link>
        <div className="text-xl md:text-2xl font-bold justify-center">
          <img src="/logo.png" alt="logo" className="w-20 h-auto" />
        </div>
        <div className="w-16 md:w-20"></div>
      </nav>

      <div className="px-4 md:px-6 lg:px-12 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center mb-8 overflow-x-auto">
            <div className="flex items-center min-w-max">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-sm md:text-base ${
                      step <= currentStep ? "bg-[#C1FE72] text-black" : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {step < currentStep ? <Check className="h-4 w-4 md:h-5 md:w-5" /> : step}
                  </div>
                  {step < 5 && <div className={`w-4 md:w-16 h-1 mx-2 ${step < currentStep ? "bg-[#C1FE72]" : "bg-gray-700"}`} />}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
              {currentStep === 1 && "Escolha seu serviço"}
              {currentStep === 2 && "Selecione seu barbeiro"}
              {currentStep === 3 && "Selecione a data"}
              {currentStep === 4 && "Escolha o horário"}
              {currentStep === 5 && "Confirme seu agendamento"}
            </h1>
            <p className="text-gray-400">Etapa {currentStep} de 5</p>
          </div>

          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedService?.id === service.id
                      ? "bg-[#C1FE72] text-black border-[#C1FE72]"
                      : "bg-gray-900 border-gray-800 hover:border-[#C1FE72] text-white"
                  }`}
                  onClick={() => setSelectedService(service)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedService?.id === service.id ? "bg-black" : "bg-[#C1FE72]"
                        }`}
                      >
                        <Scissors
                          className={`h-6 w-6 ${selectedService?.id === service.id ? "text-[#C1FE72]" : "text-black"}`}
                        />
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          selectedService?.id === service.id
                            ? "bg-black text-[#C1FE72]"
                            : "bg-teal-900 text-[#C1FE72] border-teal-800"
                        }
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {Math.ceil(service.required_slots) * 10} min
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p
                      className={`mb-4 text-sm leading-relaxed ${
                        selectedService?.id === service.id ? "text-gray-700" : "text-gray-400"
                      }`}
                    >
                      {service.description || "Serviço profissional com técnicas especializadas"}
                    </p>
                    <div className="text-2xl font-bold">R$ {service.price.toFixed(2).replace(".", ",")}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {barbers
                .filter((barber) => barber.is_active)
                .map((barber) => (
                  <Card
                    key={barber.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedBarber?.id === barber.id
                        ? "bg-[#C1FE72] text-black border-[#C1FE72]"
                        : "bg-gray-900 border-gray-800 hover:border-[#C1FE72] text-white"
                    }`}
                    onClick={() => setSelectedBarber(barber)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden ${
                            selectedBarber?.id === barber.id ? "bg-black" : "bg-[#C1FE72]"
                          }`}
                        >
                          {(barber.photo_url || barber.image_url) ? (
                            <img
                              src={barber.photo_url || barber.image_url || ""}
                              alt={barber.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <User
                            className={`h-8 w-8 ${selectedBarber?.id === barber.id ? "text-[#C1FE72]" : "text-black"} ${
                              (barber.photo_url || barber.image_url) ? "hidden" : ""
                            }`}
                          />
                        </div>
                      </div>
                      <CardTitle className="text-xl">{barber.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p
                        className={`text-sm leading-relaxed ${
                          selectedBarber?.id === barber.id ? "text-gray-700" : "text-gray-400"
                        }`}
                      >
                        {barber.specialty || "Barbeiro profissional especializado"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {currentStep === 3 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {getAvailableDates().map((dateOption) => (
                <Card
                  key={dateOption.date}
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedDate === dateOption.date
                      ? "bg-[#C1FE72] text-black border-[#C1FE72]"
                      : "bg-gray-900 border-gray-800 hover:border-[#C1FE72] text-white"
                  }`}
                  onClick={() => setSelectedDate(dateOption.date)}
                >
                  <CardContent className="p-3 md:p-4 text-center">
                    <Calendar
                      className={`h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 ${selectedDate === dateOption.date ? "text-black" : "text-[#C1FE72]"}`}
                    />
                    <div className="text-xs md:text-sm font-medium">
                      {new Date(`${dateOption.date}T00:00:00`).toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {currentStep === 4 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
              {getAvailableTimesForDate().map((timeSlot) => (
                <Card
                  key={timeSlot.id}
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedTime === timeSlot.time ? "bg-[#C1FE72] text-black border-[#C1FE72]" : "bg-gray-900 border-gray-800 hover:border-[#C1FE72] text-white"
                  }`}
                  onClick={() => setSelectedTime(timeSlot.time)}
                >
                  <CardContent className="p-3 md:p-4 text-center">
                    <Clock
                      className={`h-4 w-4 md:h-5 md:w-5 mx-auto mb-2 ${selectedTime === timeSlot.time ? "text-black" : "text-[#C1FE72]"}`}
                    />
                    <div className="text-xs md:text-sm font-medium">{timeSlot.time}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {currentStep === 5 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <User className="h-6 w-6 text-[#C1FE72]" />
                    Seus Dados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customerName" className="text-gray-400">
                      Nome Completo *
                    </Label>
                    <Input
                      id="customerName"
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white mt-2"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone" className="text-gray-400">
                      Número de Telefone *
                    </Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      placeholder="(99) 99999-9999"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white mt-2"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Check className="h-6 w-6 text-[#C1FE72]" />
                    Resumo do Agendamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-400">Serviço</Label>
                      <p className="text-white font-semibold">{selectedService?.name}</p>
                      <p className="text-[#C1FE72] font-bold">
                        R$ {selectedService?.price.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Duração</Label>
                      <p className="text-white">{Math.ceil((selectedService?.required_slots ?? 0) / 2) * 10} minutos</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Barbeiro</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#C1FE72] flex items-center justify-center">
                          {(selectedBarber?.photo_url || selectedBarber?.image_url) ? (
                            <img
                              src={selectedBarber.photo_url || selectedBarber.image_url || "/placeholder.svg"}
                              alt={selectedBarber.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <User className={`h-5 w-5 text-black ${(selectedBarber?.photo_url || selectedBarber?.image_url) ? "hidden" : ""}`} />
                        </div>
                        <p className="text-white font-semibold">{selectedBarber?.name}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-400">Data</Label>
                      <p className="text-white">
                        {new Date(selectedDate).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Horário</Label>
                      <p className="text-white">{selectedTime?.slice(0, 5)}</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-gray-400">
                      Observações (opcional)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Alguma observação especial para seu atendimento?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Seção de pagamento comentada para fins de teste */}
              {/* 
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-[#C1FE72]" />
                    Opções de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card
                      className={`cursor-pointer transition-all duration-300 ${
                        paymentOption === "50"
                          ? "bg-[#C1FE72] text-black border-[#C1FE72]"
                          : "bg-gray-800 border-gray-700 hover:border-[#C1FE72] text-white"
                      }`}
                      onClick={() => setPaymentOption("50")}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-lg font-bold mb-2">50% Antecipado</div>
                        <div className="text-sm">
                          R$ {selectedService ? (selectedService.price * 0.5).toFixed(2).replace(".", ",") : "0,00"}
                        </div>
                        <div className="text-xs mt-1 opacity-75">Restante no local</div>
                      </CardContent>
                    </Card>
                    <Card
                      className={`cursor-pointer transition-all duration-300 ${
                        paymentOption === "100"
                          ? "bg-[#C1FE72] text-black border-[#C1FE72]"
                          : "bg-gray-800 border-gray-700 hover:border-[#C1FE72] text-white"
                      }`}
                      onClick={() => setPaymentOption("100")}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-lg font-bold mb-2">100% Antecipado</div>
                        <div className="text-sm">R$ {selectedService?.price.toFixed(2).replace(".", ",")}</div>
                        <div className="text-xs mt-1 opacity-75">Pagamento completo</div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
              */}

              {/* Aviso para fins de teste */}
              <Card className="bg-yellow-900 border-yellow-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-yellow-200">
                    <Check className="h-5 w-5" />
                    <span className="font-semibold">Modo de Teste</span>
                  </div>
                  <p className="text-yellow-100 text-sm mt-2">
                    O pagamento foi desabilitado para fins de teste. O agendamento será confirmado diretamente.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="border-gray-600 text-white hover:bg-gray-900 bg-transparent w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            {currentStep < 5 ? (
              <Button
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && !selectedService) ||
                  (currentStep === 2 && !selectedBarber) ||
                  (currentStep === 3 && !selectedDate) ||
                  (currentStep === 4 && !selectedTime)
                }
                className="bg-[#C1FE72] text-black hover:bg-[#A8E55A] font-semibold w-full sm:w-auto"
              >
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handlePayment}
                disabled={isLoading || !customerName || !customerPhone}
                className="bg-[#C1FE72] text-black hover:bg-[#A8E55A] font-semibold w-full sm:w-auto"
              >
                {isLoading ? "Processando..." : "Confirmar Agendamento"}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
