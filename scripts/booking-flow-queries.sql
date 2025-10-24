-- =====================================================
-- CONSULTAS SQL PARA O FLUXO DE RESERVA (5 ETAPAS)
-- Baseado na estrutura definida em structure.sql
-- =====================================================

-- ETAPA 1: BUSCAR SERVIÇOS DISPONÍVEIS
-- Retorna todos os serviços ativos para seleção
SELECT 
    id,
    name,
    description,
    price,
    required_slots,
    is_active
FROM public.services 
WHERE is_active = true 
ORDER BY price ASC;

-- ETAPA 2: BUSCAR BARBEIROS DISPONÍVEIS
-- Retorna todos os barbeiros ativos
SELECT 
    id,
    name,
    description,
    is_active,
    entered_in
FROM public.barbers 
WHERE is_active = true 
ORDER BY name ASC;

-- ETAPA 3: BUSCAR DATAS DISPONÍVEIS PARA UM BARBEIRO
-- Parâmetros: @barber_id
SELECT 
    id,
    barber_id,
    date,
    slot_start,
    slot_end,
    is_available
FROM public.dates 
WHERE barber_id = @barber_id 
    AND is_available = true 
    AND date >= CURRENT_DATE
ORDER BY date ASC;

-- ETAPA 4: BUSCAR HORÁRIOS DISPONÍVEIS PARA UMA DATA E BARBEIRO
-- Parâmetros: @barber_id, @date_id
-- Busca slots não ocupados para o barbeiro na data específica
SELECT 
    ts.id,
    ts.slot_start,
    ts.slot_size,
    ts.is_occupied,
    d.date
FROM public.timeSlots ts
INNER JOIN public.dates d ON ts.date_id = d.id
WHERE ts.barber_id = @barber_id 
    AND ts.date_id = @date_id 
    AND ts.is_occupied = false
ORDER BY ts.slot_start ASC;

-- ETAPA 5: CRIAR RESERVA
-- Esta etapa envolve múltiplas operações:

-- 5.1: Verificar se o slot ainda está disponível
SELECT 
    id,
    is_occupied
FROM public.timeSlots 
WHERE id = @time_slot_id 
    AND barber_id = @barber_id 
    AND is_occupied = false;

-- 5.2: Marcar o slot como ocupado (se disponível)
UPDATE public.timeSlots 
SET is_occupied = true 
WHERE id = @time_slot_id 
    AND is_occupied = false;

-- 5.3: Criar o registro de reserva
INSERT INTO public.booking (
    name,
    phone,
    time_slot,
    barber,
    observation
) VALUES (
    @customer_name,
    @customer_phone,
    @time_slot_id,
    @barber_id,
    @notes_length -- Armazena o comprimento das observações
);

-- =====================================================
-- CONSULTAS AUXILIARES PARA VERIFICAÇÕES
-- =====================================================

-- Verificar conflitos de horário para um barbeiro
SELECT 
    b.id as booking_id,
    b.name as customer_name,
    ts.slot_start,
    ts.slot_size,
    d.date
FROM public.booking b
INNER JOIN public.timeSlots ts ON b.time_slot = ts.id
INNER JOIN public.dates d ON ts.date_id = d.id
WHERE ts.barber_id = @barber_id 
    AND d.date = @target_date
    AND ts.is_occupied = true;

-- Buscar reservas de um cliente específico
SELECT 
    b.id,
    b.name,
    b.phone,
    bar.name as barber_name,
    d.date,
    ts.slot_start,
    ts.slot_size
FROM public.booking b
INNER JOIN public.timeSlots ts ON b.time_slot = ts.id
INNER JOIN public.dates d ON ts.date_id = d.id
INNER JOIN public.barbers bar ON b.barber = bar.id
WHERE b.phone = @customer_phone
ORDER BY d.date DESC, ts.slot_start DESC;

-- Relatório de ocupação por barbeiro e data
SELECT 
    bar.name as barber_name,
    d.date,
    COUNT(CASE WHEN ts.is_occupied = true THEN 1 END) as slots_ocupados,
    COUNT(ts.id) as total_slots,
    ROUND(
        (COUNT(CASE WHEN ts.is_occupied = true THEN 1 END) * 100.0 / COUNT(ts.id)), 
        2
    ) as percentual_ocupacao
FROM public.barbers bar
INNER JOIN public.dates d ON bar.id = d.barber_id
LEFT JOIN public.timeSlots ts ON d.id = ts.date_id AND ts.barber_id = bar.id
WHERE d.date >= CURRENT_DATE
GROUP BY bar.id, bar.name, d.date
ORDER BY d.date ASC, bar.name ASC;