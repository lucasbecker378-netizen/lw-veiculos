"use client";

import {FormEvent, useEffect, useMemo, useState} from "react";
import {supabase} from "@/lib/supabase";
import {Vehicle} from "@/lib/types";
import {money} from "@/lib/format";

const AMENITIES = [
  "Ar-condicionado","Ar digital","Direção hidráulica","Direção elétrica",
  "Vidros elétricos","Travas elétricas","Retrovisores elétricos","Bancos em couro",
  "Piloto automático","Central multimídia","Multimídia original","Rádio USB",
  "Bluetooth","Câmera de ré","Sensor de estacionamento","Chave presencial",
  "Chave reserva","Manual do usuário","Faróis de neblina","Volante escamoteável",
  "Rodas de liga leve","Teto solar","Limpador traseiro","Desembaçador traseiro",
  "Alarme","Interface","Porta-malas elétrico","Placas Mercosul",
];

const BRAND_NAMES = [
  "Alfa Romeo","Aston Martin","Land Rover","Mercedes-Benz","Mercedes Benz",
  "Chevrolet","Volkswagen","Toyota","Honda","Hyundai","Fiat","Ford","Renault",
  "Nissan","Jeep","Citroën","Citroen","Peugeot","BMW","Audi","Volvo","Mitsubishi",
  "Kia","Suzuki","Subaru","Porsche","Ram","Chery","Caoa Chery","BYD","GWM",
  "Mini","Lexus","JAC","Jac Motors"
].sort((a,b)=>b.length-a.length);

type PhotoItem =
  | {kind:"existing"; key:string; id:string; url:string}
  | {kind:"new"; key:string; file:File; url:string};

function normalize(s:string){
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu," ").trim();
}
function slugify(s:string){
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
function parseBRL(value:string){
  const cleaned=value.replace(/[^\d.,]/g,"").trim();
  if(!cleaned)return 0;
  if(cleaned.includes(","))return Number(cleaned.replace(/\./g,"").replace(",","."))||0;
  return Number(cleaned.replace(/\./g,""))||0;
}
function formatPriceField(value:number){
  return new Intl.NumberFormat("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value)||0);
}
function matchAmenity(line:string){
  const n=normalize(line);
  const aliases:[string,string[]][]=[
    ["Ar-condicionado",["ar condicionado","ar-condicionado"]],
    ["Ar digital",["ar digital","climatronic","climatizador digital"]],
    ["Direção hidráulica",["direcao hidraulica"]],
    ["Direção elétrica",["direcao eletrica"]],
    ["Vidros elétricos",["vidros eletricos","vidro eletrico"]],
    ["Travas elétricas",["travas eletricas","trava eletrica","trava eletrica nas portas"]],
    ["Retrovisores elétricos",["retrovisores eletricos","retrovisor eletrico"]],
    ["Bancos em couro",["bancos de couro","banco de couro","bancos em couro","banco em couro"]],
    ["Piloto automático",["piloto automatico","controle de cruzeiro","cruise control"]],
    ["Central multimídia",["central multimidia","multimidia"]],
    ["Multimídia original",["multimidia original"]],
    ["Rádio USB",["radio usb","som usb","usb"]],
    ["Bluetooth",["bluetooth"]],
    ["Câmera de ré",["camera de re"]],
    ["Sensor de estacionamento",["sensor de estacionamento","sensores de estacionamento"]],
    ["Chave presencial",["chave presencial","keyless"]],
    ["Chave reserva",["chave reserva"]],
    ["Manual do usuário",["manual do usuario","manual do proprietário","manual do proprietario"]],
    ["Faróis de neblina",["farois de neblina","farol de neblina"]],
    ["Volante escamoteável",["volante escamoteavel"]],
    ["Rodas de liga leve",["rodas de liga leve","roda de liga leve"]],
    ["Teto solar",["teto solar"]],
    ["Limpador traseiro",["limpador traseiro"]],
    ["Desembaçador traseiro",["desembacador traseiro"]],
    ["Alarme",["alarme"]],
    ["Interface",["interface"]],
    ["Porta-malas elétrico",["porta malas eletrico","porta-malas eletrico"]],
    ["Placas Mercosul",["placas mercosul","placa mercosul"]],
  ];
  for(const [canonical,names] of aliases){
    if(names.some(x=>n===normalize(x)||n.includes(normalize(x))))return canonical;
  }
  return null;
}

function parseQuickText(raw:string){
  const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length)return null;
  const title=lines[0];
  const fullNorm=normalize(lines.join(" "));

  const transmission =
    /\b(manual|mecanico|mecanica)\b/.test(fullNorm) ? "Manual" :
    /\b(automatico|automatica)\b/.test(fullNorm) ? "Automático" : "";

  const fuel =
    /\bdiesel\b/.test(fullNorm) ? "Diesel" :
    /\b(flex|flexfuel|flex fuel)\b/.test(fullNorm) ? "Flex" :
    /\bgasolina\b/.test(fullNorm) ? "Gasolina" :
    /\b(etanol|alcool)\b/.test(fullNorm) ? "Etanol" :
    /\b(hibrido|hibrida)\b/.test(fullNorm) ? "Híbrido" :
    /\b(eletrico|eletrica)\b/.test(fullNorm) ? "Elétrico" : "";

  const yearMatch=title.match(/\b(19|20)\d{2}\b/);
  const year=yearMatch?Number(yearMatch[0]):0;

  let brand="";
  for(const candidate of BRAND_NAMES){
    if(normalize(title).startsWith(normalize(candidate)+" ")||normalize(title)===normalize(candidate)){
      brand=candidate; break;
    }
  }
  if(!brand)brand=title.split(/\s+/)[0]||"";

  let remaining=title;
  const brandRegex=new RegExp("^"+brand.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\s*","i");
  remaining=remaining.replace(brandRegex,"").trim();
  if(yearMatch)remaining=remaining.replace(yearMatch[0]," ").trim();
  remaining=remaining.replace(/\bautom[aá]tic[oa]\b/ig," ").replace(/\bmanual\b/ig," ").replace(/\s+/g," ").trim();

  const parts=remaining.split(/\s+/).filter(Boolean);
  const model=parts[0]||"";
  const version=parts.slice(1).join(" ");

  let price=0, priceIndex=-1;
  for(let i=lines.length-1;i>=1;i--){
    if(/^(R\$\s*)?[\d.]+,\d{2}$/.test(lines[i])||/^(R\$\s*)?\d{4,}$/.test(lines[i])){
      price=parseBRL(lines[i]); priceIndex=i; break;
    }
  }

  const foundAmenities:string[]=[];
  const leftovers:string[]=[];
  lines.slice(1).forEach((line,idx)=>{
    const actualIndex=idx+1;
    if(actualIndex===priceIndex)return;
    const amenity=matchAmenity(line);
    if(amenity){
      if(!foundAmenities.includes(amenity))foundAmenities.push(amenity);
    }else{
      const n=normalize(line);
      const isSpec =
        /\b(manual|automatico|automatica|gasolina|diesel|flex|etanol|alcool|hibrido|hibrida|eletrico|eletrica)\b/.test(n);
      if(!isSpec)leftovers.push(line);
    }
  });

  return {brand,model,version,year,transmission,fuel,price,optional_items:foundAmenities,description:leftovers.join("\n")};
}

function generateProfessionalDescription(data:{
  brand:string;model:string;version:string;year:number;model_year:number;price:number;
  transmission:string;fuel:string;color:string;optional_items:string[];
}){
  const vehicleName=[data.brand,data.model,data.version].filter(Boolean).join(" ").trim();
  const yearText=data.model_year&&data.model_year!==data.year?`${data.year}/${data.model_year}`:`${data.year}`;
  const intro=`${vehicleName} ${yearText}${data.transmission?` ${data.transmission}`:""} à venda na LW Veículos, em Venâncio Aires - RS.`;
  const details=[
    data.transmission?`câmbio ${data.transmission.toLowerCase()}`:"",
    data.fuel?`combustível ${data.fuel.toLowerCase()}`:"",
    data.color?`cor ${data.color.toLowerCase()}`:"",
  ].filter(Boolean);
  const detailsText=details.length
    ?`Uma opção para quem procura um veículo com ${details.join(", ")} e atendimento direto durante a negociação.`
    :"Uma opção para quem busca um veículo com informações claras e atendimento direto durante a negociação.";
  const equipmentText=data.optional_items.length
    ?`Entre os principais itens e comodidades, este veículo conta com ${data.optional_items.map(x=>x.toLowerCase()).join(", ")}.`
    :"";
  const priceText=data.price?`${vehicleName} ${yearText} por ${money(data.price)}.`:"";
  const cta="Entre em contato com a LW Veículos para consultar disponibilidade, condições de negociação, troca e financiamento. Atendimento em Venâncio Aires e região.";
  return [intro,detailsText,equipmentText,priceText,cta].filter(Boolean).join("\n\n");
}
function generateSeoPreview(data:{brand:string;model:string;version:string;year:number;model_year:number;transmission:string;}){
  const vehicleName=[data.brand,data.model,data.version].filter(Boolean).join(" ").trim();
  const yearText=data.model_year&&data.model_year!==data.year?`${data.year}/${data.model_year}`:`${data.year}`;
  const title=`${vehicleName} ${yearText}${data.transmission?` ${data.transmission}`:""} em Venâncio Aires | LW Veículos`;
  const description=`${vehicleName} ${yearText}${data.transmission?` ${data.transmission}`:""} à venda na LW Veículos em Venâncio Aires - RS. Confira fotos, equipamentos, preço e fale com nossa equipe.`;
  return {title,description};
}

export default function VehicleForm({initial}:{initial?:Vehicle}){
  const localKey=initial?.id?`lw-vehicle-edit-${initial.id}`:"lw-vehicle-new-draft";
  const [quickText,setQuickText]=useState("");
  const [parseNotice,setParseNotice]=useState("");
  const [form,setForm]=useState({
    brand:initial?.brand||"",
    model:initial?.model||"",
    version:initial?.version||"",
    slug:initial?.slug||"",
    year:initial?.year||new Date().getFullYear(),
    model_year:initial?.model_year||new Date().getFullYear(),
    price:initial?.price||0,
    transmission:initial?.transmission||"",
    fuel:initial?.fuel||"",
    color:initial?.color||"",
    description:initial?.description||"",
    optional_items:initial?.optional_items||[] as string[],
    status:initial?.status||"draft",
    featured:initial?.featured||false,
    featured_order:initial?.featured_order||0,
  });
  const [priceText,setPriceText]=useState(()=>formatPriceField(Number(initial?.price||0)));
  const [photos,setPhotos]=useState<PhotoItem[]>([]);
  const [removedExisting,setRemovedExisting]=useState<{id:string;url:string}[]>([]);
  const [message,setMessage]=useState("");
  const [seoPreview,setSeoPreview]=useState<{title:string;description:string}|null>(null);
  const [dragIndex,setDragIndex]=useState<number|null>(null);
  const [showPreview,setShowPreview]=useState(false);
  const [localSaved,setLocalSaved]=useState(false);

  useEffect(()=>{
    if(initial?.id){
      supabase.from("vehicle_images").select("id,url,sort_order").eq("vehicle_id",initial.id).order("sort_order")
        .then(({data})=>setPhotos((data||[]).map((x:any)=>({kind:"existing" as const,key:x.id,id:x.id,url:x.url}))));
    }else{
      try{
        const saved=localStorage.getItem(localKey);
        if(saved){
          const x=JSON.parse(saved);
          if(x.form)setForm((c:any)=>({...c,...x.form}));
          if(x.quickText)setQuickText(x.quickText);
          if(x.priceText)setPriceText(x.priceText);
        }
      }catch{}
    }
  },[initial?.id]);

  useEffect(()=>{
    if(initial?.id)return;
    const timer=setTimeout(()=>{
      try{
        localStorage.setItem(localKey,JSON.stringify({form,quickText,priceText}));
        setLocalSaved(true);
        setTimeout(()=>setLocalSaved(false),1200);
      }catch{}
    },600);
    return()=>clearTimeout(timer);
  },[form,quickText,priceText,initial?.id]);

  const missing=useMemo(()=>{
    const items:string[]=[];
    if(!form.brand)items.push("marca");
    if(!form.model)items.push("modelo");
    if(!form.year)items.push("ano");
    if(!parseBRL(priceText))items.push("preço");
    if(!form.color)items.push("cor");
    if(!form.transmission)items.push("câmbio");
    if(!form.fuel)items.push("combustível");
    return items;
  },[form,priceText]);

  const photoCount=photos.length;
  const publishBlocked=form.status!=="draft"&&(!form.transmission||!form.fuel);

  function setField(name:string,value:any){setForm(c=>({...c,[name]:value}));}
  function toggleAmenity(item:string){
    setForm(c=>({...c,optional_items:c.optional_items.includes(item)?c.optional_items.filter(x=>x!==item):[...c.optional_items,item]}));
  }
  function reorder<T>(items:T[],from:number,to:number){
    const copy=[...items]; const [item]=copy.splice(from,1); copy.splice(to,0,item); return copy;
  }
  function dropPhoto(target:number){
    if(dragIndex===null||dragIndex===target)return;
    setPhotos(c=>reorder(c,dragIndex,target)); setDragIndex(null);
  }
  function removePhoto(index:number){
    const photo=photos[index];
    if(photo.kind==="existing")setRemovedExisting(c=>[...c,{id:photo.id,url:photo.url}]);
    setPhotos(c=>c.filter((_,i)=>i!==index));
  }
  function addFiles(list:FileList|null){
    if(!list)return;
    const additions=Array.from(list).map((file,i)=>({
      kind:"new" as const,
      key:`new-${Date.now()}-${i}-${file.name}`,
      file,
      url:URL.createObjectURL(file)
    }));
    setPhotos(c=>[...c,...additions]);
  }
  function interpretQuickText(){
    const parsed=parseQuickText(quickText);
    if(!parsed){setParseNotice("Cole os dados recebidos antes de interpretar.");return;}
    const generatedSlug=slugify([parsed.brand,parsed.model,parsed.version,parsed.year].filter(Boolean).join(" "));
    setForm(c=>({
      ...c,
      brand:parsed.brand||c.brand, model:parsed.model||c.model, version:parsed.version||c.version,
      slug:generatedSlug||c.slug, year:parsed.year||c.year, model_year:parsed.year||c.model_year,
      price:parsed.price||c.price, transmission:parsed.transmission||"",
      fuel:parsed.fuel||"", optional_items:parsed.optional_items.length?parsed.optional_items:c.optional_items,
      description:parsed.description||c.description
    }));
    if(parsed.price)setPriceText(formatPriceField(parsed.price));
    const found=[
      parsed.brand&&`marca: ${parsed.brand}`,parsed.model&&`modelo: ${parsed.model}`,
      parsed.version&&`versão: ${parsed.version}`,parsed.year&&`ano: ${parsed.year}`,
      parsed.transmission&&`câmbio: ${parsed.transmission}`,parsed.fuel&&`combustível: ${parsed.fuel}`,
      parsed.price&&`preço: ${money(parsed.price)}`,parsed.optional_items.length&&`${parsed.optional_items.length} comodidade(s)`
    ].filter(Boolean).join(" · ");
    const unknown=[!parsed.transmission&&"câmbio",!parsed.fuel&&"combustível"].filter(Boolean).join(" e ");
    setParseNotice(`${found?`Interpretado: ${found}. `:""}${unknown?`Confirme manualmente: ${unknown}.`:"Revise os dados antes de salvar."}`);
  }
  function generateDescription(){
    const price=parseBRL(priceText);
    setField("price",price);
    setField("description",generateProfessionalDescription({...form,price}));
    setSeoPreview(generateSeoPreview(form));
  }

  async function similarExists(price:number){
    if(initial)return false;
    const {data}=await supabase.from("vehicles").select("id,vehicle_code,brand,model,version,year,price")
      .eq("brand",form.brand).eq("model",form.model).eq("year",Number(form.year))
      .limit(5);
    const similar=(data||[]).find((x:any)=>
      normalize(x.version||"")===normalize(form.version||"") &&
      Math.abs(Number(x.price)-price)<1
    );
    if(!similar)return false;
    return !confirm(`Já existe um veículo muito parecido cadastrado${similar.vehicle_code?` (${similar.vehicle_code})`:""}. Deseja cadastrar mesmo assim?`);
  }

  async function save(e:FormEvent){
    e.preventDefault();
    const price=parseBRL(priceText);

    if(form.status!=="draft"&&(!form.transmission||!form.fuel)){
      setMessage("Para publicar, confirme o câmbio e o combustível. Ou salve como Rascunho.");
      return;
    }
    if(!form.brand||!form.model||!form.slug||!form.year||!price){
      setMessage("Preencha marca, modelo, slug, ano e preço.");
      return;
    }
    if(await similarExists(price))return;

    setMessage("Salvando...");
    const payload={...form,price,year:Number(form.year),model_year:Number(form.model_year),mileage:0,featured_order:Number(form.featured_order)||0};
    let vehicleId=initial?.id;

    if(initial){
      const {error}=await supabase.from("vehicles").update(payload).eq("id",initial.id);
      if(error){setMessage(error.message);return;}
    }else{
      const {data,error}=await supabase.from("vehicles").insert(payload).select("id").single();
      if(error){setMessage(error.message);return;}
      vehicleId=data.id;
    }

    for(const removed of removedExisting){
      await supabase.from("vehicle_images").delete().eq("id",removed.id);
      const marker="/storage/v1/object/public/vehicle-images/";
      const at=removed.url.indexOf(marker);
      if(at>=0){
        const path=decodeURIComponent(removed.url.slice(at+marker.length));
        await supabase.storage.from("vehicle-images").remove([path]);
      }
    }

    if(vehicleId){
      for(let i=0;i<photos.length;i++){
        const photo=photos[i];
        if(photo.kind==="existing"){
          const {error}=await supabase.from("vehicle_images").update({sort_order:i}).eq("id",photo.id);
          if(error){setMessage(`Veículo salvo, mas houve erro na ordem das fotos: ${error.message}`);return;}
        }else{
          const ext=photo.file.name.split(".").pop()||"jpg";
          const path=`${vehicleId}/${Date.now()}-${i}.${ext}`;
          const upload=await supabase.storage.from("vehicle-images").upload(path,photo.file);
          if(upload.error){setMessage(`Veículo salvo, mas houve erro em uma foto: ${upload.error.message}`);return;}
          const url=supabase.storage.from("vehicle-images").getPublicUrl(path).data.publicUrl;
          const ins=await supabase.from("vehicle_images").insert({vehicle_id:vehicleId,url,sort_order:i});
          if(ins.error){setMessage(`Veículo salvo, mas houve erro ao registrar uma foto: ${ins.error.message}`);return;}
        }
      }
    }

    try{localStorage.removeItem(localKey);}catch{}
    window.location.href="/admin";
  }

  function input(name:string,label:string,type="text"){
    return <label><span className="text-sm font-bold">{label}</span><input type={type}
      className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3"
      value={(form as any)[name]} onChange={e=>setField(name,e.target.value)}
      required={["brand","model","slug","year"].includes(name)}/></label>;
  }

  return <form onSubmit={save} className="mt-8 grid gap-6 rounded-[28px] border border-black/10 bg-white p-6 md:grid-cols-2">
    {!initial&&<section className="md:col-span-2 rounded-[24px] border border-[#d6bd00]/30 bg-[#fffbe2] p-5">
      <p className="text-xs font-black uppercase tracking-[.14em] text-[#8a7700]">Cadastro rápido</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black">Cole os dados recebidos do veículo</h2>
        {localSaved&&<span className="text-xs font-bold text-neutral-500">Rascunho salvo automaticamente</span>}
      </div>
      <textarea className="mt-5 min-h-56 w-full rounded-2xl border border-black/10 bg-white px-4 py-4 leading-7"
        value={quickText} onChange={e=>setQuickText(e.target.value)}
        placeholder={"Exemplo:\nHonda CR-V 2.0 2011 Automático\n\nAr Condicionado\nDireção Elétrica\n...\n\n58.900,00"}/>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="button" onClick={interpretQuickText} className="btn-dark rounded-2xl px-6 py-4 font-bold">Interpretar dados</button>
        {parseNotice&&<p className="max-w-3xl text-sm leading-6 text-neutral-600">{parseNotice}</p>}
      </div>
    </section>}

    <div className="md:col-span-2 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[.14em] text-neutral-500">Revisão</p>
        <h2 className="mt-1 text-2xl font-black">Dados do veículo</h2>
      </div>
      {missing.length>0&&<div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm"><b>Confira:</b> {missing.join(", ")}</div>}
    </div>

    {input("brand","Marca")}
    {input("model","Modelo")}
    {input("version","Versão")}
    {input("slug","Slug (endereço do anúncio)")}
    {input("year","Ano","number")}
    {input("model_year","Ano modelo","number")}

    <label><span className="text-sm font-bold">Preço</span>
      <div className="mt-2 flex items-center rounded-2xl border border-black/10 bg-white px-4">
        <span className="mr-2 font-bold text-neutral-500">R$</span>
        <input type="text" inputMode="decimal" className="w-full bg-transparent py-3 outline-none"
          value={priceText} onChange={e=>setPriceText(e.target.value.replace(/[^0-9.,]/g,""))}
          onBlur={()=>{const value=parseBRL(priceText);setField("price",value);setPriceText(formatPriceField(value));}}
          placeholder="39.900,00" required/>
      </div><p className="mt-1 text-xs text-neutral-500">Formato: 39.900,00</p>
    </label>
    {input("color","Cor")}

    <label><span className="text-sm font-bold">Câmbio</span>
      <select className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3" value={form.transmission} onChange={e=>setField("transmission",e.target.value)}>
        <option value="">Não identificado</option><option value="Automático">Automático</option><option value="Manual">Manual</option>
      </select>
      {!form.transmission&&<p className="mt-2 text-xs font-bold text-amber-700">Confirme antes de publicar.</p>}
    </label>

    <label><span className="text-sm font-bold">Combustível</span>
      <select className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3" value={form.fuel} onChange={e=>setField("fuel",e.target.value)}>
        <option value="">Não identificado</option><option>Flex</option><option>Gasolina</option><option>Diesel</option><option>Etanol</option><option>Híbrido</option><option>Elétrico</option>
      </select>
      {!form.fuel&&<p className="mt-2 text-xs font-bold text-amber-700">Confirme antes de publicar.</p>}
    </label>

    <div className="md:col-span-2">
      <span className="text-sm font-bold">Comodidades</span>
      <p className="mt-1 text-sm text-neutral-500">As identificadas no texto ficam marcadas; você pode ajustar manualmente.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {AMENITIES.map(item=>{const active=form.optional_items.includes(item);return <button key={item} type="button" onClick={()=>toggleAmenity(item)}
          className={active?"btn-yellow rounded-full px-4 py-2.5 text-sm font-bold":"btn-outline-dark rounded-full px-4 py-2.5 text-sm font-bold"}>
          {active?"✓ ":""}{item}</button>})}
      </div>
    </div>

    <div className="md:col-span-2 rounded-[24px] border border-black/10 bg-[#fafaf7] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><span className="text-sm font-bold">Descrição profissional do anúncio</span>
          <p className="mt-1 text-sm text-neutral-500">Gere um texto padronizado usando apenas os dados confirmados.</p></div>
        <button type="button" onClick={generateDescription} className="btn-yellow rounded-2xl px-5 py-3 text-sm font-black">Gerar descrição com SEO</button>
      </div>
      <textarea className="mt-4 min-h-56 w-full rounded-2xl border border-black/10 bg-white px-4 py-4 leading-7"
        value={form.description} onChange={e=>setField("description",e.target.value)}/>
      {seoPreview&&<div className="mt-5 rounded-2xl border border-black/10 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[.14em] text-[#8a7700]">Prévia para Google</p>
        <p className="mt-3 font-bold text-[#1a0dab]">{seoPreview.title}</p>
        <p className="mt-2 text-sm leading-6 text-neutral-600">{seoPreview.description}</p>
      </div>}
    </div>

    <div className="md:col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><span className="text-sm font-bold">Fotos do veículo</span>
          <p className="mt-1 text-sm text-neutral-500">Arraste para ordenar. A foto nº 1 será a capa.</p></div>
        <div className="text-right"><p className="text-sm font-black">{photoCount} foto(s)</p>
          {photoCount<5&&<p className="text-xs font-bold text-amber-700">Recomendamos pelo menos 5 fotos.</p>}</div>
      </div>
      <input type="file" multiple accept="image/*" className="mt-3 block w-full rounded-2xl border border-black/10 p-3" onChange={e=>addFiles(e.target.files)}/>
      {photos.length>0&&<div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {photos.map((photo,index)=><div key={photo.key} draggable onDragStart={()=>setDragIndex(index)} onDragEnd={()=>setDragIndex(null)}
          onDragOver={e=>e.preventDefault()} onDrop={()=>dropPhoto(index)}
          className={`overflow-hidden rounded-2xl border bg-white ${dragIndex===index?"border-[#d6bd00] opacity-60":"border-black/10"}`}>
          <div className="relative cursor-grab"><img src={photo.url} alt={`Foto ${index+1}`} className="aspect-[4/3] w-full select-none object-cover pointer-events-none"/>
            <span className="absolute right-2 top-2 rounded-full bg-black/80 px-2 py-1 text-[11px] font-black text-white">{index+1}</span>
            {index===0&&<span className="absolute left-2 top-2 rounded-full bg-[#ffe331] px-2 py-1 text-[11px] font-black text-black">CAPA</span>}
            <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black">⠿ ARRASTE</span>
          </div>
          <button type="button" onClick={()=>removePhoto(index)} className="w-full border-t border-black/10 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Remover foto</button>
        </div>)}
      </div>}
    </div>

    <label><span className="text-sm font-bold">Status</span>
      <select className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3" value={form.status} onChange={e=>setField("status",e.target.value)}>
        <option value="draft">Rascunho</option><option value="available">Disponível</option><option value="sold">Vendido</option>
      </select>
      {form.status==="draft"&&<p className="mt-2 text-xs text-neutral-500">Rascunhos não aparecem no site público.</p>}
    </label>

    <div className="grid gap-4">
      <label className="flex items-center gap-3 pt-1"><input type="checkbox" checked={form.featured} onChange={e=>setField("featured",e.target.checked)}/>
        <span className="font-bold">Destaque na Home</span></label>
      {form.featured&&<label><span className="text-sm font-bold">Ordem do destaque</span>
        <input type="number" min="0" className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3" value={form.featured_order} onChange={e=>setField("featured_order",e.target.value)}/>
        <p className="mt-1 text-xs text-neutral-500">0 aparece antes de 1, 2, 3...</p></label>}
    </div>

    {showPreview&&<section className="md:col-span-2 rounded-[28px] bg-[#0b0b0b] p-6 text-white">
      <p className="text-xs font-black uppercase tracking-[.14em] text-[#ffe331]">Pré-visualização</p>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>{photos[0]?<img src={photos[0].url} alt="Prévia" className="aspect-[4/3] w-full rounded-2xl object-cover"/>:<div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-white/10 text-neutral-400">Sem foto</div>}</div>
        <div><p className="text-sm text-neutral-400">{form.year}/{form.model_year||form.year} · {form.transmission||"Câmbio não identificado"}</p>
          <h3 className="mt-2 text-3xl font-black">{form.brand} {form.model}</h3>
          {form.version&&<p className="mt-1 text-neutral-400">{form.version}</p>}
          <p className="mt-5 text-3xl font-black text-[#ffe331]">{money(parseBRL(priceText))}</p>
          <p className="mt-5 whitespace-pre-line text-sm leading-6 text-neutral-300">{form.description||"Sem descrição gerada."}</p>
        </div>
      </div>
    </section>}

    <div className="md:col-span-2 flex flex-wrap items-center gap-3 border-t border-black/10 pt-6">
      <button type="button" onClick={()=>setShowPreview(x=>!x)} className="btn-outline-dark rounded-2xl px-6 py-4 font-bold">{showPreview?"Fechar prévia":"Pré-visualizar"}</button>
      <button disabled={publishBlocked} className="btn-dark rounded-2xl px-7 py-4 font-bold disabled:cursor-not-allowed disabled:opacity-40">
        {form.status==="draft"?"Salvar rascunho":"Salvar e publicar"}
      </button>
      <a href="/admin" className="btn-outline-dark rounded-2xl px-6 py-4 font-bold">Cancelar</a>
      {message&&<span className="text-sm font-bold text-neutral-600">{message}</span>}
    </div>
  </form>;
}
