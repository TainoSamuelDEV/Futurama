"use client"

import { useState } from "react"
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
  is_active: boolean
}

interface TimeSlot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  barber_id: string
}

interface BookingFlowProps {
  services: Service[]
  timeSlots: TimeSlot[]
  barbers: Barber[]
}

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

export default function BookingFlow({ services, timeSlots, barbers }: BookingFlowProps) {
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

    const dates = []
    const today = new Date()

    const barberTimeSlots = timeSlots.filter((slot) => slot.barber_id === selectedBarber.id)
    const availableDaysOfWeek = [...new Set(barberTimeSlots.map((slot) => slot.day_of_week))]

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dayOfWeek = date.getDay()

      if (availableDaysOfWeek.includes(dayOfWeek)) {
        dates.push({
          date: date.toISOString().split("T")[0],
          dayOfWeek,
          displayDate: date.toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
          }),
        })
      }
    }
    return dates
  }

  const getAvailableTimesForDate = () => {
    if (!selectedDate || !selectedBarber) return []

    const date = new Date(selectedDate)
    const dayOfWeek = date.getDay()

    return timeSlots.filter((slot) => slot.day_of_week === dayOfWeek && slot.barber_id === selectedBarber.id)
  }

  const handleBooking = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime || !customerName || !customerPhone) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("bookings").insert({
        service_id: selectedService.id,
        barber_id: selectedBarber.id,
        booking_date: selectedDate,
        booking_time: selectedTime,
        customer_name: customerName,
        customer_phone: customerPhone,
        notes: notes || null,
        status: "pending",
        payment_option: paymentOption,
      })

      if (error) throw error

      router.push("/booking/success")
    } catch (error) {
      console.error("Error creating booking:", error)
      alert("Erro ao criar agendamento. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = () => {
    if (!paymentOption) return
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
          <span>Voltar</span>
        </Link>
        <div className="text-xl md:text-2xl font-bold justify-center">
          <img src="logo3.png" alt="wid" className="w-45 h-auto" />
          {/* <span className="text-white">Barber</span>
          <span className="text-[#C1FE72]">Shop</span> */}
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
                  {step < 5 && <div className={`w-12 md:w-16 h-1 mx-2 ${step < currentStep ? "bg-[#C1FE72]" : "bg-gray-700"}`} />}
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
                        {service.duration_minutes}min
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
                          className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden ${
                            selectedBarber?.id === barber.id ? "bg-black" : "bg-[#C1FE72]"
                          }`}
                        >
                          {barber.image_url ? (
                            <img
                              src={barber.image_url || "/placeholder.svg"}
                              alt={barber.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User
                              className={`h-8 w-8 ${selectedBarber?.id === barber.id ? "text-[#C1FE72]" : "text-black"}`}
                            />
                          )}
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
                      className={`h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 ${
                        selectedDate === dateOption.date ? "text-black" : "text-[#C1FE72]"
                      }`}
                    />
                    <div className="text-xs md:text-sm font-medium">{dateOption.displayDate}</div>
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
                    selectedTime === timeSlot.start_time
                      ? "bg-[#C1FE72] text-black border-[#C1FE72]"
                      : "bg-gray-900 border-gray-800 hover:border-[#C1FE72] text-white"
                  }`}
                  onClick={() => setSelectedTime(timeSlot.start_time)}
                >
                  <CardContent className="p-3 md:p-4 text-center">
                    <Clock
                      className={`h-4 w-4 md:h-5 md:w-5 mx-auto mb-2 ${
                        selectedTime === timeSlot.start_time ? "text-black" : "text-[#C1FE72]"
                      }`}
                    />
                    <div className="text-xs md:text-sm font-medium">{timeSlot.start_time.slice(0, 5)}</div>
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
                      placeholder="(11) 99999-9999"
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
                      <p className="text-white">{selectedService?.duration_minutes} minutos</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Barbeiro</Label>
                      <p className="text-white font-semibold">{selectedBarber?.name}</p>
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
                disabled={isLoading || !customerName || !customerPhone || !paymentOption}
                className="bg-[#C1FE72] text-black hover:bg-[#A8E55A] font-semibold w-full sm:w-auto"
              >
                {isLoading ? "Processando..." : "Ir para Pagamento"}
                <CreditCard className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
