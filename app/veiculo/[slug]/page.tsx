import type {Metadata} from "next";
import VehicleDetailClient from "@/components/VehicleDetailClient";
import {serverSupabase} from "@/lib/serverSupabase";
import {money} from "@/lib/format";

type Props={params:Promise<{slug:string}>};

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;
  const db=serverSupabase();
  const {data:v}=await db.from("vehicles").select("*").eq("slug",slug).in("status",["available","sold"]).maybeSingle();
  if(!v)return {title:"Veículo não encontrado",robots:{index:false,follow:true}};
  const title=[v.brand,v.model,v.version,v.year,v.transmission].filter(Boolean).join(" ");
  const description=`${title} ${v.status==="sold"?"vendido":"à venda"} na LW Veículos em Venâncio Aires - RS. ${money(Number(v.price))}. Confira fotos e detalhes.`;
  const {data:image}=await db.from("vehicle_images").select("url").eq("vehicle_id",v.id).order("sort_order").limit(1).maybeSingle();
  return {
    title,
    description,
    robots:v.status==="available"?{index:true,follow:true}:{index:false,follow:true},
    alternates:{canonical:`/veiculo/${slug}`},
    openGraph:{
      title:`${title} | LW Veículos`,
      description,
      type:"website",
      images:image?.url?[{url:image.url,alt:title}]:["/estoque-lw.jpeg"],
    },
    twitter:{card:"summary_large_image",title,description,images:image?.url?[image.url]:["/estoque-lw.jpeg"]},
  };
}

export default async function Page({params}:Props){
  const {slug}=await params;
  return <VehicleDetailClient slug={slug}/>;
}
