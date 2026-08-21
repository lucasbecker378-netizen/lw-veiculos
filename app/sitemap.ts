import type {MetadataRoute} from "next";
import {serverSupabase} from "@/lib/serverSupabase";

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const base=process.env.NEXT_PUBLIC_SITE_URL || "https://lw-veiculos.vercel.app";
  const fixed:MetadataRoute.Sitemap=[
    {url:base,lastModified:new Date(),changeFrequency:"weekly",priority:1},
    {url:`${base}/estoque`,lastModified:new Date(),changeFrequency:"daily",priority:.9},
  ];

  try{
    const db=serverSupabase();
    const {data}=await db.from("vehicles").select("slug,updated_at").eq("status","available");
    return [
      ...fixed,
      ...(data||[]).map(v=>({
        url:`${base}/veiculo/${v.slug}`,
        lastModified:new Date(v.updated_at||Date.now()),
        changeFrequency:"weekly" as const,
        priority:.8,
      }))
    ];
  }catch{
    return fixed;
  }
}
