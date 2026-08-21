"use client";

import {useEffect,useState} from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VehicleCard from "@/components/VehicleCard";
import {supabase} from "@/lib/supabase";
import {Vehicle} from "@/lib/types";

export default function Home(){
  const [vehicles,setVehicles]=useState<Vehicle[]>([]);
  const wa=process.env.NEXT_PUBLIC_WHATSAPP||"5551996118804";

  useEffect(()=>{
    supabase.from("vehicles").select("*").eq("status","available")
      .order("featured",{ascending:false}).order("featured_order",{ascending:true})
      .order("created_at",{ascending:false}).limit(6)
      .then(({data})=>setVehicles((data||[]) as Vehicle[]));
  },[]);

  return <><Header/><main>
    <section className="relative min-h-[560px] overflow-hidden bg-black text-white sm:min-h-[680px]">
      <img src="/estoque-lw.jpeg" alt="Estoque da LW Veículos" className="absolute inset-0 h-full w-full object-cover object-center sm:object-center"/>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.42),rgba(0,0,0,.82))] sm:bg-gradient-to-r sm:from-black sm:via-black/80 sm:to-black/20"/>
      <div className="container relative flex min-h-[560px] items-end pb-12 pt-14 sm:min-h-[680px] sm:items-center sm:py-20">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[.24em] text-[#ffe331] sm:text-xs">LW Veículos · Venâncio Aires</p>
          <h1 className="mt-4 max-w-[620px] text-[42px] font-black leading-[.96] tracking-[-.045em] sm:mt-6 sm:text-6xl lg:text-7xl">
            Seu próximo carro está aqui.
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-7 text-neutral-200 sm:mt-7 sm:text-lg sm:leading-8">
            Compra, venda, troca e financiamento com atendimento direto e veículos selecionados.
          </p>
          <div className="mt-7 grid gap-3 sm:mt-9 sm:flex sm:flex-wrap">
            <a href="/estoque" className="btn-yellow rounded-2xl px-7 py-4 text-center font-black sm:rounded-full">Ver estoque</a>
            <a target="_blank" rel="noreferrer" href={`https://wa.me/${wa}`} className="btn-outline-light rounded-2xl px-7 py-4 text-center font-bold sm:rounded-full">Falar no WhatsApp</a>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-[#ffe331] py-4 sm:py-5">
      <div className="container grid grid-cols-2 gap-x-4 gap-y-3 text-center text-[11px] font-black uppercase tracking-[.12em] sm:grid-cols-4 sm:text-sm">
        <span>Compra</span><span>Venda</span><span>Troca</span><span>Financiamento</span>
      </div>
    </section>

    <section className="container py-14 sm:py-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-neutral-500 sm:text-xs">Disponíveis agora</p>
          <h2 className="mt-2 text-[34px] font-black leading-none tracking-tight sm:mt-3 sm:text-5xl">Veículos em destaque</h2>
        </div>
        <a href="/estoque" className="text-sm font-black">Ver estoque completo →</a>
      </div>

      {vehicles.length
        ?<div className="mt-7 grid gap-5 sm:mt-10 md:grid-cols-2 lg:grid-cols-3">{vehicles.map(x=><VehicleCard key={x.id} vehicle={x}/>)}</div>
        :<div className="mt-7 rounded-[22px] border border-dashed border-black/20 bg-white p-6 sm:mt-10 sm:rounded-[28px] sm:p-10">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#9a8400]">Estoque em atualização</p>
          <h3 className="mt-3 text-2xl font-black sm:text-3xl">Novos veículos serão publicados em breve.</h3>
          <p className="mt-3 leading-6 text-neutral-600">Fale com a equipe para consultar as oportunidades disponíveis hoje.</p>
        </div>}
    </section>

    <section id="sobre" className="bg-[#0b0b0b] py-14 text-white sm:py-20">
      <div className="container grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <img src="/fachada-lw.jpeg" alt="Fachada da LW Veículos" className="aspect-[16/11] w-full rounded-[22px] object-cover sm:aspect-[4/3] sm:rounded-[32px]"/>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#ffe331] sm:text-xs">Conheça a LW</p>
          <h2 className="mt-2 text-[34px] font-black leading-[1.02] tracking-tight sm:mt-3 sm:text-5xl">Negócio próximo, atendimento direto.</h2>
          <p className="mt-5 text-base leading-7 text-neutral-300 sm:mt-6 sm:text-lg sm:leading-8">
            A LW Veículos está em Venâncio Aires para ajudar você a comprar, vender, trocar ou financiar seu veículo com praticidade.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
            {[["Estoque selecionado","Veículos com informações claras e fotos."],["Atendimento rápido","Converse diretamente com a equipe pelo WhatsApp."],["Troca de veículo","Consulte seu veículo na negociação."],["Financiamento","Consulte possibilidades para sua compra."]].map(([a,b])=>
              <div key={a} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:rounded-3xl sm:p-5">
                <h3 className="text-sm font-black sm:text-base">{a}</h3>
                <p className="mt-2 text-xs leading-5 text-neutral-400 sm:text-sm sm:leading-6">{b}</p>
              </div>)}
          </div>
        </div>
      </div>
    </section>

    <section id="contato" className="bg-white py-14 sm:py-20">
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-10">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#9a8400] sm:text-xs">Onde estamos</p>
            <h2 className="mt-2 text-[34px] font-black leading-[1.04] sm:mt-3 sm:text-4xl">Venha conhecer a LW Veículos.</h2>

            <div className="mt-6 flex items-start gap-3 rounded-[20px] border border-black/10 bg-[#f7f7f3] p-4 sm:mt-7 sm:gap-4 sm:rounded-[24px] sm:p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ffe331] sm:h-12 sm:w-12" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="#090909" strokeWidth="2">
                  <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>
                </svg>
              </div>
              <div><p className="font-black">LW Veículos</p>
                <p className="mt-1 text-sm leading-6 text-neutral-600 sm:text-base sm:leading-7">Rua Dr. Armando Ruschel, 1701<br/>Gressler · Venâncio Aires/RS · 95800-000</p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-[22px] border border-black/10 bg-neutral-100 shadow-sm sm:mt-5 sm:rounded-[28px]">
              <iframe title="Localização da LW Veículos no Google Maps"
                src="https://www.google.com/maps?q=Rua%20Dr.%20Armando%20Ruschel%2C%201701%2C%20Gressler%2C%20Ven%C3%A2ncio%20Aires%20RS&output=embed"
                width="100%" height="300" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                style={{border:0,display:"block"}} allowFullScreen/>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              <a target="_blank" rel="noreferrer" href="https://www.google.com/maps/place/LW+Ve%C3%ADculos/@-29.6227371,-52.2131098,17z/data=!3m1!4b1!4m6!3m5!1s0x951c916793012f8f:0x7eff27cf85cb0e4a!8m2!3d-29.6227371!4d-52.2105349!16s%2Fg%2F11rl0fkw7k?entry=ttu&g_ep=EgoyMDI2MDgxNy4wIKXMDSoASAFQAw%3D%3D"
                className="btn-dark rounded-xl px-4 py-3 text-center text-sm font-bold sm:rounded-full sm:px-6 sm:py-4">Google Maps</a>
              <a target="_blank" rel="noreferrer" href="https://www.instagram.com/lw_veiculos/" className="btn-outline-dark rounded-xl px-4 py-3 text-center text-sm font-bold sm:rounded-full sm:px-6 sm:py-4">Instagram</a>
            </div>
          </div>

          <div className="rounded-[24px] bg-[#f3f3ef] p-5 sm:rounded-[32px] sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[.18em] text-neutral-500 sm:text-xs">Horário de funcionamento</p>
            <div className="mt-5 grid gap-4 text-sm sm:mt-6">
              <div className="flex justify-between gap-4 border-b border-black/10 pb-4"><b>Segunda</b><span className="text-right">08:00–12:00<br className="sm:hidden"/> · 13:30–18:00</span></div>
              <div className="flex justify-between gap-4 border-b border-black/10 pb-4"><b>Terça a sexta</b><span className="text-right">08:00–18:00</span></div>
              <div className="flex justify-between gap-4 border-b border-black/10 pb-4"><b>Sábado</b><span className="text-right">08:00–12:00</span></div>
              <div className="flex justify-between gap-4"><b>Domingo</b><span className="text-right">Fechado</span></div>
            </div>
            <a target="_blank" rel="noreferrer" href={`https://wa.me/${wa}`} className="btn-yellow mt-6 block rounded-2xl px-5 py-4 text-center font-black sm:mt-8">
              (51) 99611-8804 · WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  </main><Footer/></>;
}
