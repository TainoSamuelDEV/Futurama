import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Scissors, Clock, ArrowLeft, Calendar } from "lucide-react"

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
  is_active: boolean
}

export default async function ServicesPage() {
  const supabase = await createClient()

  // Fetch services from database
  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true })

  if (error) {
    console.error("Error fetching services:", error)
  }

  const servicesList: Service[] = services || []

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 md:px-12">
        <Link href="/" className="flex items-center gap-2 text-white hover:text-[#C1FE72] transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span>Voltar</span>
        </Link>
        <div className="text-2xl font-bold">
          <img src="logo3.png" alt="wid" className="w-45 h-auto" />
          {/* <span className="text-white">Barber</span>
          <span className="text-[#C1FE72]">Shop</span> */}
        </div>
        <Link href="/booking">
          <Button className="bg-[#C1FE72] text-black hover:bg-[#A8E55A] font-semibold">Agendar</Button>
        </Link>
      </nav>

      {/* Header Section */}
      <section className="px-6 md:px-12 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-teal-900 text-[#C1FE72] border-teal-800">Nossos Serviços</Badge>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Qualidade e <span className="text-[#C1FE72]">precisão</span>
            <br />
            em cada atendimento
          </h1>

          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto text-pretty">
            Descubra nossa gama completa de serviços especializados em cuidados masculinos, com técnicas tradicionais e
            equipamentos modernos.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto">
          {servicesList.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicesList.map((service) => (
                <Card
                  key={service.id}
                  className="bg-gray-900 border-gray-800 hover:border-[#C1FE72] transition-all duration-300 hover:shadow-lg hover:shadow-[#C1FE72]/10"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-12 h-12 bg-[#C1FE72] rounded-full flex items-center justify-center">
                        <Scissors className="h-6 w-6 text-black" />
                      </div>
                      <Badge variant="secondary" className="bg-teal-900 text-[#C1FE72] border-teal-800">
                        <Clock className="h-3 w-3 mr-1" />
                        {service.duration_minutes}min
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-white">{service.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                      {service.description || "Serviço profissional com técnicas especializadas"}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-[#C1FE72]">
                        R$ {service.price.toFixed(2).replace(".", ",")}
                      </div>
                      <Link href="/booking">
                        <Button
                          size="sm"
                          className="bg-transparent border border-[#C1FE72] text-[#C1FE72] hover:bg-[#C1FE72] hover:text-black transition-colors"
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Agendar
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scissors className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-400">Nenhum serviço disponível</h3>
              <p className="text-gray-500">Os serviços serão carregados em breve.</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-6 md:px-12 py-16 bg-gray-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para o seu <span className="text-[#C1FE72]">novo visual</span>?
          </h2>
          <p className="text-gray-400 text-lg mb-8">Agende seu horário e experimente o melhor em cuidados masculinos</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/booking">
              <Button size="lg" className="bg-[#C1FE72] text-black hover:bg-[#A8E55A] font-semibold px-8 py-3 text-lg">
                <Calendar className="mr-2 h-5 w-5" />
                Agendar Agora
              </Button>
            </Link>
            <Link href="/">
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-900 px-8 py-3 text-lg bg-transparent"
              >
                Voltar ao Início
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="px-6 md:px-12 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[#C1FE72] rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Horário</h3>
              <p className="text-gray-400">Seg - Sáb: 8h às 18h</p>
              <p className="text-gray-400">Dom: Fechado</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-teal-700 rounded-full flex items-center justify-center mb-4">
                <Scissors className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Qualidade</h3>
              <p className="text-gray-400">Profissionais experientes</p>
              <p className="text-gray-400">Equipamentos modernos</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-teal-900 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-[#C1FE72]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Agendamento</h3>
              <p className="text-gray-400">Online 24h</p>
              <p className="text-gray-400">Confirmação imediata</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 px-6 md:px-12 py-8 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-2xl font-bold mb-4 flex justify-center">
            <img src="logo3.png" alt="wid" className="w-45 h-auto" />
            {/* <span className="text-white">Barber</span>
            <span className="text-[#C1FE72]">Shop</span> */}
          </div>
          <p className="text-gray-400">© 2025 Barbearia Futurama. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
