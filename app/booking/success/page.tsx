import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Check, Calendar, Home } from "lucide-react"

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Card className="bg-gray-900 border-gray-800 text-center">
          <CardHeader className="pb-4">
            <div className="w-16 h-16 bg-[#C1FE72] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-black" />
            </div>
            <CardTitle className="text-2xl text-white">Agendamento Confirmado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-400">
              Seu agendamento foi realizado com sucesso. Você receberá uma confirmação em breve.
            </p>

            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Status do agendamento:</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-500 font-semibold">Pendente confirmação</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/" className="w-full">
                <Button className="w-full bg-[#C1FE72] text-black hover:bg-[#A8E55A] font-semibold">
                  <Home className="h-4 w-4 mr-2" />
                  Voltar ao Início
                </Button>
              </Link>
              <Link href="/booking" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-gray-600 text-white hover:bg-gray-900 bg-transparent"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
