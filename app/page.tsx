"use client";
import {useEffect,useState} from "react";import Header from "@/components/Header";import Footer from "@/components/Footer";import VehicleCard from "@/components/VehicleCard";import {supabase} from "@/lib/supabase";import {Vehicle} from "@/lib/types";
export default function Home(){const[v,setV]=useState<Vehicle[]>([]);const wa=process.env.NEXT_PUBLIC_WHATSAPP||"5551996118804";useEffect(()=>{supabase.from("vehicles").select("*").eq("status","available").order("featured",{ascending:false}).order("created_at",{ascending:false}).limit(6).then(({data})=>setV((data||[]) as Vehicle[]))},[]);return <><Header/><main>
<section className="relative min-h-[680px] overflow-hidden bg-black text-white"><img src="/estoque-lw.jpeg" alt="Estoque da LW Veículos" className="absolute inset-0 h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20"/><div className="container relative flex min-h-[680px] items-center py-20"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.28em] text-[#ffe331]">LW Veículos · Venâncio Aires</p><h1 className="mt-6 text-5xl font-black leading-[.94] tracking-[-.045em] sm:text-6xl lg:text-7xl">Seu próximo carro está aqui.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-neutral-200">Compra, venda, troca e financiamento com atendimento direto e veículos selecionados.</p><div className="mt-9 flex flex-wrap gap-3"><a href="/estoque" className="btn-yellow rounded-full px-7 py-4 font-black">Ver estoque</a><a target="_blank" href={`https://wa.me/${wa}`} className="btn-outline-light rounded-full px-7 py-4 font-bold">Falar no WhatsApp</a></div></div></div></section>
<section className="bg-[#ffe331] py-5"><div className="container grid gap-3 text-center text-sm font-black uppercase tracking-[.12em] sm:grid-cols-4"><span>Compra</span><span>Venda</span><span>Troca</span><span>Financiamento</span></div></section>
<section className="container py-20"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-neutral-500">Disponíveis agora</p><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Veículos em destaque</h2></div><a href="/estoque" className="font-bold">Ver estoque completo →</a></div>{v.length?<div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{v.map(x=><VehicleCard key={x.id} vehicle={x}/>)}</div>:<div className="mt-10 rounded-[28px] border border-dashed border-black/20 bg-white p-10"><p className="text-sm font-black uppercase tracking-[.18em] text-[#9a8400]">Estoque em atualização</p><h3 className="mt-3 text-3xl font-black">Novos veículos serão publicados em breve.</h3><p className="mt-3 text-neutral-600">Fale com a equipe para consultar as oportunidades disponíveis hoje.</p></div>}</section>
<section id="sobre" className="bg-[#0b0b0b] py-20 text-white"><div className="container grid items-center gap-12 lg:grid-cols-2"><img src="/fachada-lw.jpeg" alt="Fachada da LW Veículos" className="aspect-[4/3] w-full rounded-[32px] object-cover"/><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#ffe331]">Conheça a LW</p><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Negócio próximo, atendimento direto.</h2><p className="mt-6 text-lg leading-8 text-neutral-300">A LW Veículos está em Venâncio Aires para ajudar você a comprar, vender, trocar ou financiar seu veículo com praticidade.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{[["Estoque selecionado","Veículos com informações claras e fotos."],["Atendimento rápido","Converse diretamente com a equipe pelo WhatsApp."],["Troca de veículo","Consulte seu veículo na negociação."],["Financiamento","Consulte possibilidades para sua compra."]].map(([a,b])=><div key={a} className="rounded-3xl border border-white/10 bg-white/5 p-5"><h3 className="font-black">{a}</h3><p className="mt-2 text-sm leading-6 text-neutral-400">{b}</p></div>)}</div></div></div></section>
<section id="contato" className="bg-white py-20">
<div className="container">
  <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
    <div>
      <p className="text-xs font-black uppercase tracking-[.2em] text-[#9a8400]">Onde estamos</p>
      <h2 className="mt-3 text-4xl font-black">Venha conhecer a LW Veículos.</h2>

      <div className="mt-7 flex items-start gap-4 rounded-[24px] border border-black/10 bg-[#f7f7f3] p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ffe331]" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#090909" strokeWidth="2">
            <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/>
            <circle cx="12" cy="10" r="2.5"/>
          </svg>
        </div>
        <div>
          <p className="font-black">LW Veículos</p>
          <p className="mt-1 leading-7 text-neutral-600">Rua Dr. Armando Ruschel, 1701<br/>Gressler · Venâncio Aires/RS · 95800-000</p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[28px] border border-black/10 bg-neutral-100 shadow-sm">
        <iframe
          title="Localização da LW Veículos no Google Maps"
          src="https://www.google.com/maps?q=Rua%20Dr.%20Armando%20Ruschel%2C%201701%2C%20Gressler%2C%20Ven%C3%A2ncio%20Aires%20RS&output=embed"
          width="100%"
          height="360"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{border:0,display:"block"}}
          allowFullScreen
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a target="_blank" rel="noreferrer" href="https://www.google.com/maps/place/LW+Ve%C3%ADculos/@-29.6227371,-52.2131098,17z/data=!3m1!4b1!4m6!3m5!1s0x951c916793012f8f:0x7eff27cf85cb0e4a!8m2!3d-29.6227371!4d-52.2105349!16s%2Fg%2F11rl0fkw7k?entry=ttu&g_ep=EgoyMDI2MDgxNy4wIKXMDSoASAFQAw%3D%3D" className="btn-dark rounded-full px-6 py-4 font-bold">Abrir no Google Maps</a>
        <a target="_blank" rel="noreferrer" href="https://www.instagram.com/lw_veiculos/" className="btn-outline-dark rounded-full px-6 py-4 font-bold">Instagram</a>
      </div>
    </div>

    <div className="rounded-[32px] bg-[#f3f3ef] p-8">
      <p className="text-xs font-black uppercase tracking-[.2em] text-neutral-500">Horário de funcionamento</p>
      <div className="mt-6 grid gap-4 text-sm">
        <div className="flex justify-between gap-5 border-b border-black/10 pb-4"><b>Segunda</b><span className="text-right">08:00–12:00 · 13:30–18:00</span></div>
        <div className="flex justify-between gap-5 border-b border-black/10 pb-4"><b>Terça a sexta</b><span className="text-right">08:00–18:00</span></div>
        <div className="flex justify-between gap-5 border-b border-black/10 pb-4"><b>Sábado</b><span className="text-right">08:00–12:00</span></div>
        <div className="flex justify-between gap-5"><b>Domingo</b><span className="text-right">Fechado</span></div>
      </div>
      <a target="_blank" rel="noreferrer" href={`https://wa.me/${wa}`} className="btn-yellow mt-8 block rounded-2xl px-6 py-4 text-center font-black">(51) 99611-8804 · WhatsApp</a>
    </div>
  </div>
</div>
</section>
</main><Footer/></>}