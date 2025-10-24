-- Script para migrar slots de 5 minutos para 10 minutos
-- IMPORTANTE: Execute este script com cuidado e faça backup antes!

-- 1. Atualizar tabela dates - converter slot_start e slot_end de 5min para 10min
UPDATE public.dates 
SET 
  slot_start = slot_start / 2,
  slot_end = slot_end / 2;

-- 2. Atualizar tabela timeSlots - converter slot_start de 5min para 10min
UPDATE public.timeSlots 
SET 
  slot_start = slot_start / 2,
  slot_size = CASE 
    WHEN slot_size IS NOT NULL THEN slot_size / 2 
    ELSE 1 
  END;

-- 3. Atualizar tabela services - ajustar required_slots se necessário
-- (assumindo que required_slots já está em incrementos corretos)
-- Se necessário, descomente e ajuste:
-- UPDATE public.services 
-- SET required_slots = required_slots / 2;

-- 4. Verificar os dados após a migração
SELECT 'dates' as tabela, MIN(slot_start) as min_slot, MAX(slot_end) as max_slot FROM public.dates
UNION ALL
SELECT 'timeSlots' as tabela, MIN(slot_start) as min_slot, MAX(slot_start + COALESCE(slot_size, 1)) as max_slot FROM public.timeSlots;

-- 5. Exemplo de como os horários ficam após a migração:
-- Antes: slot_start = 96 (5min) = 96 * 5 = 480 min = 8:00 AM
-- Depois: slot_start = 48 (10min) = 48 * 10 = 480 min = 8:00 AM