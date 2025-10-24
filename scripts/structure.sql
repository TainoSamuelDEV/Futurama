-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.barbers (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean,
  entered_in timestamp with time zone DEFAULT now(),
  CONSTRAINT barbers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.booking (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  phone character varying NOT NULL,
  time_slot bigint NOT NULL,
  barber bigint NOT NULL,
  service_id bigint NOT NULL,
  payment_status character varying NOT NULL DEFAULT 'NPAGO',
  observation text,
  CONSTRAINT booking_pkey PRIMARY KEY (id),
  CONSTRAINT booking_barber_fkey FOREIGN KEY (barber) REFERENCES public.barbers(id),
  CONSTRAINT booking_time_slot_fkey FOREIGN KEY (time_slot) REFERENCES public.timeSlots(id),
  CONSTRAINT booking_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT booking_payment_status_check CHECK (payment_status IN ('PAGO', 'NPAGO', 'METPAGO'))
);
CREATE TABLE public.dates (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  barber_id bigint NOT NULL,
  slot_start smallint NOT NULL, -- Agora em incrementos de 10 minutos
  slot_end smallint NOT NULL,   -- Agora em incrementos de 10 minutos
  date date NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  CONSTRAINT dates_pkey PRIMARY KEY (id),
  CONSTRAINT dates_barber_id_fkey FOREIGN KEY (barber_id) REFERENCES public.barbers(id)
);
CREATE TABLE public.services (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  description text,
  price real NOT NULL,
  required_slots numeric NOT NULL, -- Agora em incrementos de 10 minutos
  is_active boolean,
  CONSTRAINT services_pkey PRIMARY KEY (id)
);
CREATE TABLE public.timeSlots (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  slot_start smallint,          -- Agora em incrementos de 10 minutos
  slot_size smallint,           -- Agora em incrementos de 10 minutos
  date_id bigint,
  is_occupied boolean NOT NULL DEFAULT true,
  barber_id bigint,
  CONSTRAINT timeSlots_pkey PRIMARY KEY (id),
  CONSTRAINT timeSlots_date_id_fkey FOREIGN KEY (date_id) REFERENCES public.dates(id),
  CONSTRAINT timeSlots_barber_id_fkey FOREIGN KEY (barber_id) REFERENCES public.barbers(id)
);