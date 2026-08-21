"use client";

import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VehicleCard from "@/components/VehicleCard";
import {supabase} from "@/lib/supabase";
import {Vehicle,VehicleImage} from "@/lib/types";
import {money} from "@/lib/format";

export default function Page(){
  const p=useParams<{slug:string}>();
  const [v,setV]=useState<Vehicle|null>(null);
  const [imgs,setImgs]=useState<VehicleImage[]>([]);
  const [active,setActive]=useState(0);
  const [similar,setSimilar]=useState<Vehicle[]>([]);
  const [copied,setCopied]=useState(false);

  useEffect(()=>{
    if(!p.slug)return;
    supabase.from("vehicles").select("*").eq("slug",p.slug).eq("status","available").maybeSingle().then(async({data})=>{
      if(!data)return;
      const vehicle=data as Vehicle; setV(vehicle);
      const r=await supabase.from("vehicle_images").select("*").eq("vehicle_id",vehicle.id).order("sort_order");
      setImgs((r.data||[]) as VehicleImage[]);
      const s=await supabase.from("vehicles").select("*").eq("status","available").neq("id",vehicle.id).limit(12);
      const ranked=((s.data||[]) as Vehicle[]).sort((a,b)=>{
        const brandA=a.brand===vehicle.brand?0:1, brandB=b.brand===vehicle.brand?0:1;
        if(brandA!==brandB)return brandA-brandB;
        return Math.abs(Number(a.price)-Number(vehicle.price))-Math.abs(Number(b.price)-Number(vehicle.price));
      }).slice(0,3);
      setSimilar(ranked);
    });
  },[p.slug]);

  const title=useMemo(()=>v?[v.brand,v.model,v.version].filter(Boolean).join(" "):"",[v]);

  if(!v)return <><Header/><main className="container py-20"><h1 className="text-2xl font-black">Veículo não encontrado ou indisponível.</h1><a href="/estoque" className="mt-5 inline-block font-bold">← Voltar ao estoque</a></main><Footer/></>;

  const wa=process.env.NEXT_PUBLIC_WHATSAPP||"5551996118804";
  const msg=encodeURIComponent(`Olá! Tenho interesse no veículo ${v.vehicle_code||""} — ${title} ${v.year}. Vi o anúncio pelo site da LW Veículos.`);

  async function share(){
    const shareData={title:`${title} | LW Veículos`,text:`Confira este ${title} na LW Veículos`,url:window.location.href};
    try{
      if(navigator.share)await navigator.share(shareData);
      else{await navigator.clipboard.writeText(window.location.href);setCopied(true);setTimeout(()=>setCopied(false),1800);}
    }catch{}
  }

  return <><Header/><main className="container py-6 sm:py-12">
    <a href="/estoque" className="text-sm font-bold text-neutral-500">← Voltar ao estoque</a>

    <div className="mt-5 grid gap-7 sm:mt-6 sm:gap-10 lg:grid-cols-[1.25fr_.75fr]">
      <section>
        <div className="overflow-hidden rounded-[20px] bg-neutral-100 sm:rounded-[28px]">
          {imgs[active]?<img src={imgs[active].url} alt={`${title} - foto ${active+1}`} className="aspect-[16/10] w-full object-cover"/>
            :<div className="flex aspect-[16/10] items-center justify-center text-neutral-400">SEM FOTOS</div>}
        </div>
        {imgs.length>1&&<div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {imgs.map((img,i)=><button type="button" key={img.id} onClick={()=>setActive(i)}
            className={`overflow-hidden rounded-xl border-2 ${i===active?"border-[#d6bd00]":"border-transparent"}`}>
            <img src={img.url} alt={`Miniatura ${i+1}`} className="aspect-[4/3] w-full object-cover"/>
          </button>)}
        </div>}
      </section>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="flex flex-wrap items-center gap-2">
          {v.vehicle_code&&<span className="rounded-full bg-[#ffe331] px-3 py-1 text-xs font-black">Código {v.vehicle_code}</span>}
          {v.featured&&<span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">Destaque</span>}
        </div>
        <p className="mt-5 text-sm font-bold text-neutral-500">{v.year}/{v.model_year||v.year} · {v.transmission}</p>
        <h1 className="mt-2 text-[32px] font-black leading-[1.02] tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-5 text-[32px] font-black sm:mt-7 sm:text-4xl">{money(v.price)}</p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-7 sm:gap-3">
          <div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold uppercase text-neutral-400">Câmbio</p><b className="mt-1 block">{v.transmission}</b></div>
          <div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold uppercase text-neutral-400">Combustível</p><b className="mt-1 block">{v.fuel}</b></div>
          <div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold uppercase text-neutral-400">Cor</p><b className="mt-1 block">{v.color||"Não informado"}</b></div>
          <div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold uppercase text-neutral-400">Ano</p><b className="mt-1 block">{v.year}/{v.model_year||v.year}</b></div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
          <a target="_blank" rel="noreferrer" href={`https://wa.me/${wa}?text=${msg}`} className="btn-yellow rounded-2xl px-5 py-4 text-center font-black">Tenho interesse</a>
          <button type="button" onClick={share} className="btn-outline-dark rounded-2xl px-5 py-4 text-center font-bold">{copied?"Link copiado":"Compartilhar"}</button>
        </div>
      </aside>
    </div>

    <div className="mt-12 grid gap-8 lg:grid-cols-2">
      {v.optional_items?.length?<section><h2 className="text-2xl font-black">Comodidades</h2>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">{v.optional_items.map(item=><div key={item} className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium">✓ {item}</div>)}</div>
      </section>:null}
      {v.description&&<section><h2 className="text-2xl font-black">Sobre este veículo</h2><p className="mt-5 whitespace-pre-line leading-7 text-neutral-600">{v.description}</p></section>}
    </div>

    {similar.length>0&&<section className="mt-16 border-t border-black/10 pt-12">
      <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-neutral-500">Você também pode gostar</p>
        <h2 className="mt-2 text-3xl font-black">Veículos semelhantes</h2></div><a href="/estoque" className="font-bold">Ver estoque →</a></div>
      <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{similar.map(x=><VehicleCard key={x.id} vehicle={x}/>)}</div>
    </section>}
  </main>

  <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 backdrop-blur lg:hidden">
    <a target="_blank" rel="noreferrer" href={`https://wa.me/${wa}?text=${msg}`} className="btn-yellow block rounded-2xl px-5 py-4 text-center font-black">
      WhatsApp · {v.vehicle_code||title}
    </a>
  </div>
  <div className="h-20 lg:hidden"/>
  <Footer/></>;
}
