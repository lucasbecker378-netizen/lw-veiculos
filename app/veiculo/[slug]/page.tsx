"use client";

import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {supabase} from "@/lib/supabase";
import {Vehicle,VehicleImage} from "@/lib/types";
import {money} from "@/lib/format";

export default function Page(){
  const p=useParams<{slug:string}>();
  const[v,setV]=useState<Vehicle|null>(null);
  const[imgs,setImgs]=useState<VehicleImage[]>([]);

  useEffect(()=>{
    if(!p.slug)return;
    supabase.from("vehicles").select("*").eq("slug",p.slug).maybeSingle().then(async({data})=>{
      if(!data)return;
      setV(data as Vehicle);
      const r=await supabase.from("vehicle_images").select("*").eq("vehicle_id",data.id).order("sort_order");
      setImgs((r.data||[]) as VehicleImage[]);
    });
  },[p.slug]);

  if(!v)return <><Header/><main className="container py-20">Carregando...</main><Footer/></>;

  const wa=process.env.NEXT_PUBLIC_WHATSAPP||"5551996118804";
  const msg=encodeURIComponent(`Olá! Tenho interesse no ${v.brand} ${v.model}${v.version?` ${v.version}`:""} anunciado no site da LW Veículos.`);

  return (
    <>
      <Header/>
      <main className="container py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {imgs.length
              ? imgs.map((i,n)=><img key={i.id} src={i.url} alt={`${v.brand} ${v.model}`} className={`w-full rounded-2xl object-cover ${n===0?"sm:col-span-2 aspect-[16/10]":"aspect-[4/3]"}`}/>)
              : <div className="sm:col-span-2 flex aspect-[16/10] items-center justify-center rounded-2xl bg-neutral-200">SEM FOTOS</div>}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-bold text-neutral-500">{v.year}/{v.model_year||v.year} · {v.transmission}</p>
            <h1 className="mt-3 text-4xl font-black">{v.brand} {v.model}</h1>
            {v.version&&<p className="mt-2 text-neutral-500">{v.version}</p>}
            {v.vehicle_code&&<p className="mt-3 text-xs font-black uppercase tracking-[.12em] text-neutral-400">Código {v.vehicle_code}</p>}
            <p className="mt-8 text-4xl font-black">{money(v.price)}</p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white p-4"><b>Câmbio</b><br/>{v.transmission}</div>
              <div className="rounded-xl bg-white p-4"><b>Combustível</b><br/>{v.fuel}</div>
              <div className="rounded-xl bg-white p-4"><b>Cor</b><br/>{v.color||"Não informado"}</div>
              <div className="rounded-xl bg-white p-4"><b>Ano</b><br/>{v.year}/{v.model_year||v.year}</div>
            </div>

            {v.optional_items?.length ? (
              <div className="mt-8">
                <h2 className="text-xl font-black">Comodidades</h2>
                <ul className="mt-3 grid gap-2 text-neutral-600 sm:grid-cols-2">
                  {v.optional_items.map(item=><li key={item}>✓ {item}</li>)}
                </ul>
              </div>
            ) : null}

            {v.description&&<p className="mt-8 whitespace-pre-line leading-7 text-neutral-600">{v.description}</p>}

            <a target="_blank" rel="noreferrer" href={`https://wa.me/${wa}?text=${msg}`} className="btn-dark mt-8 block rounded-xl px-6 py-4 text-center font-bold">
              Tenho interesse no WhatsApp
            </a>
          </aside>
        </div>
      </main>
      <Footer/>
    </>
  );
}
