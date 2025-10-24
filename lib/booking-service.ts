// =====================================================
// SERVIÇO DE RESERVAS - LÓGICA DE NEGÓCIO
// Implementa as 5 etapas do fluxo de reserva
// =====================================================

import { createClient } from '@/lib/supabase/client'

export interface Service {
  id: string
  name: string
  description: string | null
  price: number
  required_slots: number
  is_active: boolean
}

export interface Barber {
  id: string
  name: string
  description: string | null
  is_active: boolean
  entered_in: string
}

export interface DateSlot {
  id: string
  barber_id: string
  date: string
  slot_start: number
  slot_end: number
  is_available: boolean
}

export interface TimeSlot {
  id: string
  slot_start: number
  slot_size: number
  is_occupied: boolean
  date: string
}

export interface BookingData {
  name: string
  phone: string
  time_slot_id: string
  barber_id: string
  notes?: string
}

export class BookingService {
  private supabase = createClient()

  // ETAPA 1: Buscar serviços disponíveis
  async getAvailableServices(): Promise<Service[]> {
    const { data, error } = await this.supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) {
      console.error('Erro ao buscar serviços:', error)
      throw new Error('Falha ao carregar serviços')
    }

    return data || []
  }

  // ETAPA 2: Buscar barbeiros disponíveis
  async getAvailableBarbers(): Promise<Barber[]> {
    const { data, error } = await this.supabase
      .from('barbers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar barbeiros:', error)
      throw new Error('Falha ao carregar barbeiros')
    }

    return data || []
  }

  // ETAPA 3: Buscar datas disponíveis para um barbeiro
  async getAvailableDates(barberId: string): Promise<DateSlot[]> {
    const { data, error } = await this.supabase
      .from('dates')
      .select('*')
      .eq('barber_id', barberId)
      .eq('is_available', true)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) {
      console.error('Erro ao buscar datas:', error)
      throw new Error('Falha ao carregar datas disponíveis')
    }

    return data || []
  }

  // ETAPA 4: Buscar horários disponíveis para uma data e barbeiro
  async getAvailableTimeSlots(barberId: string, dateId: string): Promise<TimeSlot[]> {
    const { data, error } = await this.supabase
      .from('timeSlots')
      .select(`
        id,
        slot_start,
        slot_size,
        is_occupied,
        dates!inner(date)
      `)
      .eq('barber_id', barberId)
      .eq('date_id', dateId)
      .eq('is_occupied', false)
      .order('slot_start', { ascending: true })

    if (error) {
      console.error('Erro ao buscar horários:', error)
      throw new Error('Falha ao carregar horários disponíveis')
    }

    return data?.map(slot => ({
      id: slot.id,
      slot_start: slot.slot_start,
      slot_size: slot.slot_size,
      is_occupied: slot.is_occupied,
      date: (slot.dates as any).date
    })) || []
  }

  // ETAPA 5: Criar reserva (transação completa)
  async createBooking(bookingData: BookingData): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
      // 5.1: Verificar se o slot ainda está disponível
      const { data: slotCheck, error: slotError } = await this.supabase
        .from('timeSlots')
        .select('id, is_occupied')
        .eq('id', bookingData.time_slot_id)
        .eq('barber_id', bookingData.barber_id)
        .eq('is_occupied', false)
        .single()

      if (slotError || !slotCheck) {
        return { 
          success: false, 
          error: 'Horário não está mais disponível' 
        }
      }

      // 5.2: Marcar o slot como ocupado
      const { error: updateError } = await this.supabase
        .from('timeSlots')
        .update({ is_occupied: true })
        .eq('id', bookingData.time_slot_id)
        .eq('is_occupied', false)

      if (updateError) {
        console.error('Erro ao marcar slot como ocupado:', updateError)
        return { 
          success: false, 
          error: 'Falha ao reservar horário' 
        }
      }

      // 5.3: Criar o registro de reserva
      const { data: booking, error: bookingError } = await this.supabase
        .from('booking')
        .insert({
          name: bookingData.name,
          phone: bookingData.phone,
          time_slot: bookingData.time_slot_id,
          barber: bookingData.barber_id,
          observation: bookingData.notes ? bookingData.notes.length : null
        })
        .select('id')
        .single()

      if (bookingError) {
        // Reverter a marcação do slot em caso de erro
        await this.supabase
          .from('timeSlots')
          .update({ is_occupied: false })
          .eq('id', bookingData.time_slot_id)

        console.error('Erro ao criar reserva:', bookingError)
        return { 
          success: false, 
          error: 'Falha ao criar reserva' 
        }
      }

      return { 
        success: true, 
        bookingId: booking.id 
      }

    } catch (error) {
      console.error('Erro inesperado ao criar reserva:', error)
      return { 
        success: false, 
        error: 'Erro inesperado. Tente novamente.' 
      }
    }
  }

  // Método auxiliar: Converter slot_start para horário legível
  slotToTime(slotStart: number): string {
    const totalMinutes = slotStart * 5 // Cada slot = 5 minutos
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Método auxiliar: Converter horário para slot_start
  timeToSlot(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes
    return Math.floor(totalMinutes / 5)
  }

  // Buscar reservas de um cliente
  async getCustomerBookings(phone: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('booking')
      .select(`
        id,
        name,
        phone,
        barbers!inner(name),
        timeSlots!inner(
          slot_start,
          slot_size,
          dates!inner(date)
        )
      `)
      .eq('phone', phone)
      .order('id', { ascending: false })

    if (error) {
      console.error('Erro ao buscar reservas do cliente:', error)
      return []
    }

    return data || []
  }
}

// Instância singleton do serviço
export const bookingService = new BookingService()