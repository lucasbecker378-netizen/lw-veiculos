"use client";
import {Vehicle} from "@/lib/types";
import {money} from "@/lib/format";
import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabase";

export default function VehicleCard({vehicle}:{vehicle:Vehicle}) {
  const [image,setImage]=useState<string|null>(null);

  useEffect(()=>{
    supabase.from("vehicle_images").select("url").eq("vehicle_id",vehicle.id)
      .order("sort_order").limit(1).maybeSingle()
      .then(({data})=>setImage(data?.url??null));
  },[vehicle.id]);

  return <article className="group overflow-hidden rounded-[22px] border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,.04)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,.08)] sm:rounded-[26px]">
    <a href={`/veiculo/${vehicle.slug}`} className="block overflow-hidden bg-neutral-100">
      {image
        ?<img src={image} alt={`${vehicle.brand} ${vehicle.model}`} className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.02] sm:aspect-[4/3]"/>
        :<div className="flex aspect-[16/10] items-center justify-center bg-neutral-200 text-sm font-bold text-neutral-400 sm:aspect-[4/3]">SEM FOTO</div>}
    </a>
    <div className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[11px] font-black uppercase tracking-[.06em] text-neutral-500">
          {vehicle.year}/{vehicle.model_year||vehicle.year} · {vehicle.transmission}
        </p>
        {vehicle.vehicle_code&&<span className="shrink-0 rounded-full bg-[#fff7b8] px-2 py-1 text-[10px] font-black text-[#6f5d00]">{vehicle.vehicle_code}</span>}
      </div>
      <h3 className="mt-2 text-[21px] font-black leading-tight tracking-tight">{vehicle.brand} {vehicle.model}</h3>
      {vehicle.version&&<p className="mt-1 line-clamp-1 text-sm text-neutral-500">{vehicle.version}</p>}
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-[22px] font-black tracking-tight sm:text-2xl">{money(vehicle.price)}</p>
      </div>
      <a href={`/veiculo/${vehicle.slug}`} className="btn-dark mt-4 block rounded-xl px-4 py-3.5 text-center text-sm font-black">
        Ver detalhes
      </a>
    </div>
  </article>;
}
