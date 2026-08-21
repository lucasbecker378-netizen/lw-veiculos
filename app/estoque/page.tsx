"use client";

import {useEffect,useMemo,useState} from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VehicleCard from "@/components/VehicleCard";
import VehicleSkeleton from "@/components/VehicleSkeleton";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import {supabase} from "@/lib/supabase";
import {Vehicle} from "@/lib/types";

const AMENITIES=[
  "Ar-condicionado","Direção hidráulica","Direção elétrica","Vidros elétricos",
  "Travas elétricas","Central multimídia","Câmera de ré","Sensor de estacionamento",
  "Bancos em couro","Piloto automático","Chave presencial","Teto solar",
];

export default function Estoque(){
  const [vehicles,setVehicles]=useState<Vehicle[]>([]);
  const [brand,setBrand]=useState("");
  const [transmission,setTransmission]=useState("");
  const [maxPrice,setMaxPrice]=useState(200000);
  const [amenities,setAmenities]=useState<string[]>([]);
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [sort,setSort]=useState("recent");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    supabase.from("vehicles").select("*").eq("status","available").order("created_at",{ascending:false})
      .then(({data})=>{setVehicles((data||[]) as Vehicle[]);setLoading(false)});
  },[]);

  const brands=useMemo(()=>[...new Set(vehicles.map(v=>v.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR")),[vehicles]);
  const priceCeiling=useMemo(()=>{
    const highest=vehicles.length?Math.max(...vehicles.map(v=>Number(v.price)||0)):200000;
    return Math.max(50000,Math.ceil(highest/10000)*10000);
  },[vehicles]);

  useEffect(()=>setMaxPrice(priceCeiling),[priceCeiling]);

  const formattedMaxPrice=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(maxPrice);
  const filtered=useMemo(()=>{
    const list=vehicles.filter(v=>{
      const items=v.optional_items||[];
      return Number(v.price)<=maxPrice&&(!brand||v.brand===brand)&&(!transmission||v.transmission===transmission)&&amenities.every(x=>items.includes(x));
    });
    return [...list].sort((a,b)=>{
      if(sort==="price-asc")return Number(a.price)-Number(b.price);
      if(sort==="price-desc")return Number(b.price)-Number(a.price);
      return new Date(b.created_at).getTime()-new Date(a.created_at).getTime();
    });
  },[vehicles,maxPrice,brand,transmission,amenities,sort]);

  function toggleAmenity(item:string){setAmenities(c=>c.includes(item)?c.filter(x=>x!==item):[...c,item]);}
  function clearFilters(){setBrand("");setTransmission("");setMaxPrice(priceCeiling);setAmenities([]);}
  const hasFilters=Boolean(brand||transmission||maxPrice<priceCeiling||amenities.length);
  const activeCount=(brand?1:0)+(transmission?1:0)+(maxPrice<priceCeiling?1:0)+amenities.length;

  return <><Header/><main>
    <section className="bg-black py-10 text-white sm:py-16">
      <div className="container">
        <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#ffe331] sm:text-xs">LW Veículos</p>
        <h1 className="mt-2 text-[40px] font-black leading-none tracking-tight sm:mt-3 sm:text-5xl">Estoque</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-300 sm:mt-4 sm:text-base">
          Encontre o veículo ideal usando nossos filtros.
        </p>
      </div>
    </section>

    <section className="container py-7 sm:py-12">
      <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
        <button onClick={()=>setFiltersOpen(!filtersOpen)} className="btn-dark flex-1 rounded-xl px-4 py-3.5 text-sm font-black">
          {filtersOpen?"Fechar filtros":"Filtrar veículos"} {activeCount>0&&`(${activeCount})`}
        </button>
        {hasFilters&&<button onClick={clearFilters} className="btn-outline-dark rounded-xl px-4 py-3.5 text-sm font-bold">Limpar</button>}
      </div>

      <div className={`${filtersOpen?"block":"hidden"} rounded-[22px] border border-black/10 bg-white p-4 shadow-sm sm:p-6 lg:block lg:rounded-[30px]`}>
        <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
          <div className="flex min-h-[132px] flex-col rounded-[18px] border border-black/10 bg-[#fafaf7] p-4 sm:min-h-[148px] sm:rounded-[24px] sm:p-5">
            <span className="text-[11px] font-black uppercase tracking-[.1em] text-neutral-500 sm:text-xs">Valor máximo</span>
            <div className="mt-3 flex items-center justify-between gap-4 sm:mt-4">
              <span className="text-sm text-neutral-500">Até</span><strong className="text-lg text-black sm:text-xl">{formattedMaxPrice}</strong>
            </div>
            <input type="range" min="10000" max={priceCeiling} step="5000" value={maxPrice}
              onChange={e=>setMaxPrice(Number(e.target.value))} className="mt-4 w-full accent-[#d6bd00]" aria-label="Valor máximo do veículo"/>
            <div className="mt-2 flex justify-between text-[11px] text-neutral-400 sm:text-xs">
              <span>R$ 10 mil</span><span>{new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(priceCeiling)}</span>
            </div>
          </div>

          <label className="rounded-[18px] border border-black/10 bg-[#fafaf7] p-4 sm:flex sm:min-h-[148px] sm:flex-col sm:rounded-[24px] sm:p-5">
            <span className="text-[11px] font-black uppercase tracking-[.1em] text-neutral-500 sm:text-xs">Marca</span>
            <select value={brand} onChange={e=>setBrand(e.target.value)} className="mt-3 min-h-[52px] w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none sm:mt-4 sm:rounded-2xl">
              <option value="">Todas as marcas</option>{brands.map(x=><option key={x} value={x}>{x}</option>)}
            </select>
            <p className="mt-2 hidden text-xs text-neutral-400 sm:mt-auto sm:block sm:pt-3">Selecione a fabricante desejada</p>
          </label>

          <label className="rounded-[18px] border border-black/10 bg-[#fafaf7] p-4 sm:flex sm:min-h-[148px] sm:flex-col sm:rounded-[24px] sm:p-5">
            <span className="text-[11px] font-black uppercase tracking-[.1em] text-neutral-500 sm:text-xs">Câmbio</span>
            <select value={transmission} onChange={e=>setTransmission(e.target.value)} className="mt-3 min-h-[52px] w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none sm:mt-4 sm:rounded-2xl">
              <option value="">Todos os câmbios</option><option value="Manual">Manual</option><option value="Automático">Automático</option>
            </select>
            <p className="mt-2 hidden text-xs text-neutral-400 sm:mt-auto sm:block sm:pt-3">Escolha o tipo de transmissão</p>
          </label>
        </div>

        <div className="mt-5 border-t border-black/10 pt-5 sm:mt-7 sm:pt-6">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[11px] font-black uppercase tracking-[.1em] text-neutral-500 sm:text-xs">Comodidades</p>
              <p className="mt-1 text-xs text-neutral-500 sm:text-sm">Toque nas opções desejadas.</p></div>
            {hasFilters&&<button onClick={clearFilters} className="btn-outline-dark hidden rounded-full px-5 py-3 text-sm font-bold lg:block">Limpar filtros</button>}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {AMENITIES.map(item=>{
              const active=amenities.includes(item);
              return <button key={item} type="button" onClick={()=>toggleAmenity(item)}
                className={`${active?"btn-yellow":"btn-outline-dark"} shrink-0 rounded-full px-4 py-2.5 text-xs font-bold sm:text-sm`}>
                {active?"✓ ":""}{item}
              </button>;
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 sm:mt-8">
        <div><p className="text-sm text-neutral-500"><b className="text-black">{filtered.length}</b> veículo(s)</p>
          {hasFilters&&<p className="mt-1 text-[10px] font-black uppercase tracking-[.1em] text-[#9a8400] sm:text-xs">Filtros ativos</p>}</div>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-bold">
          <option value="recent">Mais recentes</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option>
        </select>
      </div>

      {loading
        ?<div className="mt-5 grid gap-5 sm:mt-6 md:grid-cols-2 lg:grid-cols-3">{[0,1,2,3,4,5].map(x=><VehicleSkeleton key={x}/>)}</div>
        :filtered.length
        ?<div className="mt-5 grid gap-5 sm:mt-6 md:grid-cols-2 lg:grid-cols-3">{filtered.map(v=><VehicleCard key={v.id} vehicle={v}/>)}</div>
        :<div className="mt-6 rounded-[22px] border border-dashed border-black/20 bg-white p-6 sm:mt-8 sm:rounded-[28px] sm:p-10">
          <h2 className="text-xl font-black sm:text-2xl">Nenhum veículo encontrado.</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600 sm:text-base">Tente remover uma comodidade ou aumentar o valor máximo.</p>
          <div className="mt-5 flex flex-wrap gap-2"><button onClick={clearFilters} className="btn-dark rounded-xl px-5 py-3.5 font-bold sm:rounded-full sm:px-6 sm:py-4">Limpar filtros</button><a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP||"5551996118804"}`} target="_blank" rel="noreferrer" className="btn-outline-dark rounded-xl px-5 py-3.5 font-bold sm:rounded-full sm:px-6 sm:py-4">Consultar oportunidades</a></div>
        </div>}
    </section>
  </main><WhatsAppFloat/><Footer/></>;
}
