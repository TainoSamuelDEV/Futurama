-- Criar tabela de barbeiros
CREATE TABLE IF NOT EXISTS barbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialty TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar barber_id à tabela time_slots
ALTER TABLE time_slots ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES barbers(id);

-- Adicionar barber_id à tabela bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES barbers(id);

-- Inserir barbeiros de exemplo
INSERT INTO barbers (name, specialty, image_url) VALUES
('Carlos Silva', 'Especialista em cortes clássicos e barba', '/placeholder.svg?height=200&width=200'),
('João Santos', 'Expert em cortes modernos e degradê', '/placeholder.svg?height=200&width=200'),
('Pedro Lima', 'Mestre em barbas e bigodes', '/placeholder.svg?height=200&width=200');

-- Atualizar time_slots existentes com barbeiros aleatórios
UPDATE time_slots 
SET barber_id = (
  SELECT id FROM barbers 
  ORDER BY RANDOM() 
  LIMIT 1
) 
WHERE barber_id IS NULL;

-- Habilitar RLS para barbers
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública dos barbeiros
CREATE POLICY "Allow public read access to barbers" ON barbers
  FOR SELECT USING (true);
