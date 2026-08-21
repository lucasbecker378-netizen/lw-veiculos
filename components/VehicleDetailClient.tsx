"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VehicleCard from "@/components/VehicleCard";
import {supabase} from "@/lib/supabase";
import {Vehicle,VehicleImage} from "@/lib/types";
import {money} from "@/lib/format";

export default function VehicleDetailClient({slug}:{slug:string}){
  const [v,setV]=useState<Vehicle|null>(null);
  const [imgs,setImgs]=useState<VehicleImage[]>([]);
  const [active,setActive]=useState(0);
  const [similar,setSimilar]=useState<Vehicle[]>([]);
  const [copied,setCopied]=useState("");
  const [lightbox,setLightbox]=useState(false);
  const touchStart=useRef<number|null>(null);

  useEffect(()=>{
    supabase.from("vehicles").select("*").eq("slug",slug).in("status",["available","sold"]).maybeSingle().then(async({data})=>{
      if(!data)return;
      const vehicle=data as Vehicle; setV(vehicle);
      const r=await supabase.from("vehicle_images").select("*").eq("vehicle_id",vehicle.id).order("sort_order");
      setImgs((r.data||[]) as VehicleImage[]);
      const s=await supabase.from("vehicles").select("*").eq("status","available").neq("id",vehicle.id).limit(12);
      const ranked=((s.data||[]) as Vehicle[]).sort((a,b)=>{
        const brandA=a.brand===vehicle.brand?0:1,brandB=b.brand===vehicle.brand?0:1;
        if(brandA!==brandB)return brandA-brandB;
        return Math.abs(Number(a.price)-Number(vehicle.price))-Math.abs(Number(b.price)-Number(vehicle.price));
      }).slice(0,3);
      setSimilar(ranked);
    });
  },[slug]);

  useEffect(()=>{
    if(!lightbox)return;
    const fn=(ev:KeyboardEvent)=>{if(ev.key==="Escape")setLightbox(false);if(ev.key==="ArrowRight")next();if(ev.key==="ArrowLeft")prev();};
    window.addEventListener("keydown",fn);document.body.style.overflow="hidden";
    return()=>{window.removeEventListener("keydown",fn);document.body.style.overflow=""};
  },[lightbox,active,imgs.length]);

  const title=useMemo(()=>v?[v.brand,v.model,v.version].filter(Boolean).join(" "):"",[v]);
  const prev=()=>setActive(i=>(i-1+imgs.length)%imgs.length);
  const next=()=>setActive(i=>(i+1)%imgs.length);

  if(!v)return <><Header/><main className="container py-20"><h1 className="text-2xl font-black">Veículo não encontrado.</h1><a href="/estoque" className="mt-5 inline-block font-bold">← Voltar ao estoque</a></main><Footer/></>;

  const vehicle=v;
  const sold=vehicle.status==="sold";
  const wa=process.env.NEXT_PUBLIC_WHATSAPP||"5551996118804";
  const msg=encodeURIComponent(`Olá! Tenho interesse no veículo ${vehicle.vehicle_code||""} — ${title} ${vehicle.year}. Vi o anúncio pelo site da LW Veículos.`);

  async function share(){
    const data={title:`${title} | LW Veículos`,text:`Confira ${title} ${vehicle.year} por ${money(vehicle.price)} na LW Veículos. Código ${vehicle.vehicle_code||""}.`,url:window.location.href};
    try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(`${data.text}\n${data.url}`);setCopied("share");setTimeout(()=>setCopied(""),1800)}}catch{}
  }
  async function copyCode(){
    if(!vehicle.vehicle_code)return;
    await navigator.clipboard.writeText(vehicle.vehicle_code);setCopied("code");setTimeout(()=>setCopied(""),1500);
  }
  function touchEnd(x:number){
    if(touchStart.current===null)return;
    const delta=x-touchStart.current;
    if(Math.abs(delta)>45){delta<0?next():prev();}
    touchStart.current=null;
  }

  return <><Header/>
    {sold&&<div className="bg-[#ffe331] px-4 py-3 text-center text-sm font-black uppercase tracking-[.08em]">Este veículo já foi vendido · Confira opções semelhantes abaixo</div>}
    <main className="container py-6 sm:py-12">
      <a href="/estoque" className="text-sm font-bold text-neutral-500">← Voltar ao estoque</a>

      <div className="mt-5 grid gap-7 sm:mt-6 sm:gap-10 lg:grid-cols-[1.25fr_.75fr]">
        <section>
          <button type="button" onClick={()=>imgs.length&&setLightbox(true)} className="relative block w-full overflow-hidden rounded-[20px] bg-neutral-100 text-left sm:rounded-[28px]">
            {imgs[active]?<img src={imgs[active].url} alt={`${title} - foto ${active+1}`} className={`aspect-[16/10] w-full object-cover ${sold?"grayscale-[35%]":""}`}/>
              :<div className="flex aspect-[16/10] items-center justify-center text-neutral-400">SEM FOTOS</div>}
            {imgs.length>0&&<span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-2 text-xs font-black text-white">↗ Ampliar · {active+1}/{imgs.length}</span>}
            {sold&&<span className="absolute left-4 top-4 rounded-full bg-black px-4 py-2 text-sm font-black text-white">VENDIDO</span>}
          </button>
          {imgs.length>1&&<div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">{imgs.map((img,i)=><button type="button" key={img.id} onClick={()=>setActive(i)}
            className={`overflow-hidden rounded-xl border-2 ${i===active?"border-[#d6bd00]":"border-transparent"}`}>
            <img src={img.url} alt={`Miniatura ${i+1}`} className="aspect-[4/3] w-full object-cover"/>
          </button>)}</div>}
        </section>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            {vehicle.vehicle_code&&<button type="button" onClick={copyCode} className="rounded-full bg-[#ffe331] px-3 py-1 text-xs font-black">Código {vehicle.vehicle_code} · {copied==="code"?"Copiado":"Copiar"}</button>}
            {vehicle.featured&&!sold&&<span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">Destaque</span>}
          </div>
          <p className="mt-5 text-sm font-bold text-neutral-500">{vehicle.year}/{vehicle.model_year||vehicle.year} · {vehicle.transmission}</p>
          <h1 className="mt-2 text-[32px] font-black leading-[1.02] tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-5 text-[32px] font-black sm:mt-7 sm:text-4xl">{money(vehicle.price)}</p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-7 sm:gap-3">
            {[["Câmbio",vehicle.transmission],["Combustível",vehicle.fuel],["Cor",vehicle.color||"Não informado"],["Ano",`${vehicle.year}/${vehicle.model_year||vehicle.year}`]].map(([a,b])=>
              <div key={a} className="rounded-2xl bg-white p-4"><p className="text-xs font-bold uppercase text-neutral-400">{a}</p><b className="mt-1 block">{b}</b></div>)}
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
            {!sold&&<a target="_blank" rel="noreferrer" href={`https://wa.me/${wa}?text=${msg}`} className="btn-yellow rounded-2xl px-5 py-4 text-center font-black">Tenho interesse</a>}
            <button type="button" onClick={share} className="btn-outline-dark rounded-2xl px-5 py-4 text-center font-bold">{copied==="share"?"Copiado":"Compartilhar"}</button>
          </div>
        </aside>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {vehicle.optional_items?.length?<section><h2 className="text-2xl font-black">Comodidades</h2><div className="mt-5 grid gap-2 sm:grid-cols-2">{vehicle.optional_items.map(item=><div key={item} className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium">✓ {item}</div>)}</div></section>:null}
        {vehicle.description&&<section><h2 className="text-2xl font-black">Sobre este veículo</h2><p className="mt-5 whitespace-pre-line leading-7 text-neutral-600">{vehicle.description}</p></section>}
      </div>

      {similar.length>0&&<section className="mt-16 border-t border-black/10 pt-12">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-neutral-500">{sold?"Outras oportunidades":"Você também pode gostar"}</p><h2 className="mt-2 text-3xl font-black">Veículos semelhantes</h2></div><a href="/estoque" className="font-bold">Ver estoque →</a></div>
        <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{similar.map(x=><VehicleCard key={x.id} vehicle={x}/>)}</div>
      </section>}
    </main>

    {lightbox&&imgs[active]&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 sm:p-8"
      onTouchStart={e=>touchStart.current=e.touches[0].clientX} onTouchEnd={e=>touchEnd(e.changedTouches[0].clientX)}>
      <button onClick={()=>setLightbox(false)} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 px-4 py-3 font-black text-white">✕</button>
      {imgs.length>1&&<><button onClick={prev} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white">‹</button>
        <button onClick={next} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white">›</button></>}
      <img src={imgs[active].url} alt={`${title} ampliada`} className="max-h-[90vh] max-w-full object-contain"/>
      <span className="absolute bottom-4 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white">{active+1} de {imgs.length}</span>
    </div>}

    {!sold&&<div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 backdrop-blur lg:hidden">
      <a target="_blank" rel="noreferrer" href={`https://wa.me/${wa}?text=${msg}`} className="btn-yellow block rounded-2xl px-5 py-4 text-center font-black">WhatsApp · {vehicle.vehicle_code||title}</a>
    </div>}
    {!sold&&<div className="h-20 lg:hidden"/>}
    <Footer/>
  </>;
}
