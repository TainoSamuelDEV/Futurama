// imports (top of file)
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Scissors, Clock, MapPin, Phone } from "lucide-react"
import logo from "@/assets/img/logo.png"
import { Pirata_One } from 'next/font/google'
import Silk from './Silk';

const pirata = Pirata_One({ subsets: ['latin'], weight: '400' })

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
        {/* Seção Superior com Fundo Silk (Navegação + Hero) */}
      <div className="relative overflow-hidden h-screen w-full">
        {/* Silk Background para toda a seção superior */}
        <Silk 
          speed={5}
          scale={1.3}
          color="#d6ffdd"
          noiseIntensity={5}
          rotation={0.3}
          className="opacity-40 absolute inset-0 z-0 w-full h-full"
        />
        
        {/* Navigation */}
        <nav className="flex items-center justify-center p-7 md:px-15 relative z-10">
          <div className="flex items-center justify-center text-2xl font-bold">
            <img src="logo1.png" alt="logo" className="w-30 h-auto" />
          </div>
        </nav>

        {/* Hero Section */}
        <section className="px-1 md:px-12 py-3 md:py-3 relative z-10">
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-teal-900 text-[#C1FE72] border-teal-800">Próximo horário livre: 8:00</Badge>

          <h1 className="text-3xl md:text-10xl lg:text-4xl font-bold mb-10 text-balance">
            PORQUE LUGAR <br /> DE HOMEM É NA
            <br />
            <span className={`${pirata.className} text-7xl lg:text-8xl`}>BARBEARIA!</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto text-pretty">
            Agende já seu horário e experimente o melhor em cortes masculinos, barba e cuidados pessoais.
          </p>

          <div className="flex flex-col sm:flex-col gap-10 justify-center items-center">
            <Link href="/booking">
              <Button size="lg" className="bg-[#C1FE72] text-black hover:bg-[#A8E55A] font-semibold px-8 py-2 text-lg">
                <Clock className="mr-2 h-5 w-5" />
                Agendar Horário
              </Button>
            </Link>
            <Link href="/services">
              {/* <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-900 px-8 py-3 text-lg bg-transparent"
              >
                Ver Serviços
              </Button> */}
            </Link>
          </div>
        </div>
        </section>
      </div>

      {/* Services Preview */}
      <section className="px-6 md:px-12 py-16 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nossos <span className="text-[#C1FE72]">Serviços</span>
            </h2>
            <p className="text-gray-400 text-lg">Qualidade e precisão em cada atendimento</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gray-900 border-gray-800 hover:border-[#C1FE72] transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <img src="cortemasculino.png" alt="" />
                  
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Corte Masculino</h3>
                <p className="text-gray-400 mb-4">Corte tradicional e moderno</p>
                <p className="text-[#C1FE72] font-bold text-lg">R$ 35,00</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 hover:border-[#C1FE72] transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <img src="barba.png" alt="" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Barba</h3>
                <p className="text-gray-400 mb-4">Aparar e modelar barba</p>
                <p className="text-[#C1FE72] font-bold text-lg">R$ 25,00</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 hover:border-[#C1FE72] transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <img src="corte+barba.png" alt="" />
                  {/* <Scissors className="h-6 w-6 text-[#C1FE72]" /> */}
                  <div className="w-2 h-2 bg-[#C1FE72] rounded-full ml-1"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Corte + Barba</h3>
                <p className="text-gray-400 mb-4">Combo completo</p>
                <p className="text-[#C1FE72] font-bold text-lg">R$ 55,00</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link href="/services">
              <Button
                variant="outline"
                className="border-[#C1FE72] text-[#C1FE72] hover:bg-[#C1FE72] hover:text-black bg-transparent"
              >
                Ver Todos os Serviços
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[#C1FE72] rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Horário</h3>
              <p className="text-gray-400">Seg - Sáb: 10h às 22h</p>
              <p className="text-gray-400">Dom: Fechado</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[#C1FE72] rounded-full flex items-center justify-center mb-4">
                <Link href="https://maps.app.goo.gl/eRpShAAXhy9ZUXs96">
                <MapPin className="h-6 w-6 text-black" />
                </Link>
                
              </div>
              <h3 className="text-lg font-semibold mb-2">Localização</h3>
              <p className="text-gray-400">Bacanga, Ao lado do Supermercado Mateus</p>
              <p className="text-gray-400">Bacanga - São Luís - 65080810</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[#C1FE72] rounded-full flex items-center justify-center mb-4">
                <Link href="https://l.instagram.com/?u=https%3A%2F%2Fwa.me%2Fmessage%2FNAAOC2XM6MS7B1%3Ffbclid%3DPAZXh0bgNhZW0CMTEAAad-XvzTJtiEAafbYxRe2jxhVoRlwLKNJF-DDeJVged3CPY0y3WTHs8j1l8T3g_aem_R7FY0kWYFSVjR24We_Bj-w&e=AT0DRsp5x7eXMzMeisTegK7OhhJkaw-VXUBwnOthsaU3AdnSS1AdMLkrMPeqcH7i1F86fgtmfMXr17pX881b14N9LvOqugid1SzyXI7kZy6URLuRn65I6g">
                <Phone className="h-6 w-6 text-black" />
                </Link>
                
              </div>
              <h3 className="text-lg font-semibold mb-2">WhatsApp</h3>
              <p className="text-gray-400">(98) 98869-1508</p>
              
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 px-6 md:px-12 py-8 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-2xl font-bold mb-4 flex justify-center">
            <img src="logo5.png" alt="logo" className="w-45 h-auto" />
            {/* <span className="text-white">Barber</span>
            <span className="text-[#C1FE72]">Shop</span> */}
          </div>
          <p className="text-gray-400">© 2025 Barbearia Futurama. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
