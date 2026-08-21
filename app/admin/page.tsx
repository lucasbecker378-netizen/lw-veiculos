"use client";

import {useEffect,useMemo,useState} from "react";
import AdminGuard from "@/components/AdminGuard";
import {supabase} from "@/lib/supabase";
import {Vehicle,VehicleStatus} from "@/lib/types";
import {money} from "@/lib/format";

export default function Admin(){
  const [vehicles,setVehicles]=useState<Vehicle[]>([]);
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState<"all"|VehicleStatus|"featured">("all");
  const [sort,setSort]=useState("recent");
  const [busy,setBusy]=useState<string|null>(null);
  const [toast,setToast]=useState("");

  const load=()=>supabase.from("vehicles").select("*").order("created_at",{ascending:false})
    .then(({data})=>setVehicles((data||[]) as Vehicle[]));
  useEffect(()=>{load();if(window.location.search.includes("saved=1")){setToast("Veículo salvo com sucesso.");window.history.replaceState({},"", "/admin");setTimeout(()=>setToast(""),3000)}},[]);

  const stats=useMemo(()=>{
    const now=new Date();
    return {
      total:vehicles.length,
      available:vehicles.filter(v=>v.status==="available").length,
      sold:vehicles.filter(v=>v.status==="sold").length,
      draft:vehicles.filter(v=>v.status==="draft").length,
      featured:vehicles.filter(v=>v.featured).length,
      month:vehicles.filter(v=>{const d=new Date(v.created_at);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()}).length,
    };
  },[vehicles]);

  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    let list=vehicles.filter(v=>{
      const hay=[v.vehicle_code,v.brand,v.model,v.version,v.year].filter(Boolean).join(" ").toLowerCase();
      const searchOk=!q||hay.includes(q);
      const statusOk=status==="all"||status==="featured"?true:v.status===status;
      const featuredOk=status==="featured"?v.featured:true;
      return searchOk&&statusOk&&featuredOk;
    });
    return [...list].sort((a,b)=>{
      if(sort==="price-asc")return Number(a.price)-Number(b.price);
      if(sort==="price-desc")return Number(b.price)-Number(a.price);
      if(sort==="code")return (a.vehicle_code||"").localeCompare(b.vehicle_code||"");
      if(sort==="featured")return Number(a.featured_order||0)-Number(b.featured_order||0);
      return new Date(b.created_at).getTime()-new Date(a.created_at).getTime();
    });
  },[vehicles,search,status,sort]);

  async function patch(id:string,values:Partial<Vehicle>){
    setBusy(id);
    const {error}=await supabase.from("vehicles").update(values).eq("id",id);
    setBusy(null);
    if(error){alert(error.message);return;}
    load();
  }

  async function removeVehicle(v:Vehicle){
    const name=[v.brand,v.model,v.version].filter(Boolean).join(" ");
    if(!confirm(`Excluir ${name}?\\n\\nEssa ação não poderá ser desfeita.`))return;
    setBusy(v.id);
    const {error}=await supabase.from("vehicles").delete().eq("id",v.id);
    setBusy(null);
    if(error){alert(error.message);return;}
    load();
  }

  async function duplicateVehicle(v:Vehicle){
    if(!confirm(`Criar uma cópia de ${v.brand} ${v.model}?\\n\\nAs fotos não serão copiadas.`))return;
    setBusy(v.id);
    const payload:any={
      brand:v.brand,model:v.model,version:v.version,year:v.year,model_year:v.model_year,
      mileage:0,price:v.price,transmission:v.transmission,fuel:v.fuel,color:v.color,
      description:v.description,optional_items:v.optional_items||[],status:"draft",featured:false,
      featured_order:0,slug:`${v.slug}-copia-${Date.now().toString().slice(-6)}`
    };
    const {error}=await supabase.from("vehicles").insert(payload);
    setBusy(null);
    if(error){alert(error.message);return;}
    load();
  }

  function exportCsv(){
    const headers=["Código","Marca","Modelo","Versão","Ano","Ano modelo","Preço","Câmbio","Combustível","Cor","Status","Destaque","Criado em","Atualizado em","Observações internas"];
    const escape=(v:any)=>`"${String(v??"").replace(/"/g,'""')}"`;
    const rows=vehicles.map(v=>[v.vehicle_code,v.brand,v.model,v.version,v.year,v.model_year,v.price,v.transmission,v.fuel,v.color,v.status,v.featured?"Sim":"Não",v.created_at,v.updated_at,v.internal_notes].map(escape).join(";"));
    const csv="\uFEFF"+headers.map(escape).join(";")+"\n"+rows.join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`estoque-lw-${new Date().toISOString().slice(0,10)}.csv`;link.click();URL.revokeObjectURL(url);
  }

  async function logout(){await supabase.auth.signOut();window.location.href="/admin/login";}

  return <AdminGuard><main className="container py-7 sm:py-12">
    {toast&&<div className="fixed right-4 top-24 z-[80] rounded-2xl bg-black px-5 py-4 text-sm font-black text-white shadow-xl">{toast}</div>}
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-xs font-black uppercase tracking-[.16em] text-[#9a8400]">Painel administrativo</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Estoque LW Veículos</h1>
        <p className="mt-2 text-sm text-neutral-500">Cadastre, edite, publique e gerencie o estoque.</p></div>
      <div className="flex flex-wrap gap-3">
        <a href="/admin/veiculos/novo" className="btn-yellow rounded-xl px-5 py-3 font-black">+ Novo veículo</a>
        <button onClick={exportCsv} className="btn-outline-dark rounded-xl px-5 py-3 font-bold">Exportar CSV</button>
        <button onClick={logout} className="btn-outline-dark rounded-xl px-5 py-3 font-bold">Sair</button>
      </div>
    </div>

    <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-3 lg:grid-cols-6">
      {[["Total",stats.total],["Disponíveis",stats.available],["Rascunhos",stats.draft],["Vendidos",stats.sold],["Destaques",stats.featured],["Este mês",stats.month]].map(([label,value])=>
        <div key={String(label)} className="rounded-2xl border border-black/10 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-[.08em] text-neutral-500">{label}</p>
          <p className="mt-2 text-2xl font-black">{value}</p>
        </div>)}
    </div>

    <section className="mt-6 rounded-[20px] border border-black/10 bg-white p-3 sm:mt-8 sm:rounded-[24px] sm:p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por código, marca, modelo, versão ou ano..."
          className="w-full rounded-xl border border-black/10 px-4 py-3"/>
        <select value={status} onChange={e=>setStatus(e.target.value as any)} className="rounded-xl border border-black/10 bg-white px-4 py-3">
          <option value="all">Todos</option><option value="available">Disponíveis</option><option value="draft">Rascunhos</option>
          <option value="sold">Vendidos</option><option value="featured">Destaques</option>
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-xl border border-black/10 bg-white px-4 py-3">
          <option value="recent">Mais recentes</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option>
          <option value="code">Código</option><option value="featured">Ordem de destaque</option>
        </select>
      </div>
      <p className="mt-3 text-xs text-neutral-500">{filtered.length} veículo(s) exibido(s)</p>
    </section>

    <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4">
      {filtered.map(v=><article key={v.id} className="rounded-[20px] border border-black/10 bg-white p-4 sm:rounded-[22px] sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {v.vehicle_code&&<span className="rounded-full bg-[#ffe331] px-3 py-1 text-xs font-black">{v.vehicle_code}</span>}
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${v.status==="available"?"bg-emerald-50 text-emerald-700":v.status==="draft"?"bg-amber-50 text-amber-700":"bg-neutral-100 text-neutral-600"}`}>
                {v.status==="available"?"Disponível":v.status==="draft"?"Rascunho":"Vendido"}
              </span>
              {v.featured&&<span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">Destaque #{v.featured_order||0}</span>}
            </div>
            <h2 className="mt-3 text-xl font-black sm:text-2xl">{v.brand} {v.model} {v.version}</h2>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-500">
              <span>{v.year}/{v.model_year||v.year}</span><span>{v.transmission||"Câmbio não identificado"}</span>
              <span>{v.fuel||"Combustível não identificado"}</span><strong className="text-black">{money(v.price)}</strong>
            </div>
            <p className="mt-2 text-xs text-neutral-400">Atualizado em {new Date(v.updated_at||v.created_at).toLocaleString("pt-BR")}</p>
            {v.internal_notes&&<p className="mt-2 max-w-3xl truncate text-xs font-medium text-amber-700">Nota interna: {v.internal_notes}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <a href={`/admin/veiculos/${v.id}`} className="btn-dark col-span-2 rounded-xl px-5 py-3 text-center text-sm font-bold sm:col-auto">Editar</a>
            {v.status!=="draft"&&<a target="_blank" rel="noreferrer" href={`/veiculo/${v.slug}`} className="btn-outline-dark rounded-xl px-4 py-3 text-center text-sm font-bold">Abrir no site ↗</a>}
            <button type="button" disabled={busy===v.id} onClick={()=>duplicateVehicle(v)} className="btn-outline-dark rounded-xl px-4 py-3 text-sm font-bold">Duplicar</button>
            {v.status==="available"
              ?<button type="button" disabled={busy===v.id} onClick={()=>patch(v.id,{status:"sold"} as any)} className="btn-outline-dark rounded-xl px-4 py-3 text-sm font-bold">Marcar vendido</button>
              :<button type="button" disabled={busy===v.id} onClick={()=>patch(v.id,{status:"available"} as any)} className="btn-outline-dark rounded-xl px-4 py-3 text-sm font-bold">Publicar</button>}
            <button type="button" disabled={busy===v.id} onClick={()=>patch(v.id,{featured:!v.featured} as any)}
              className="btn-outline-dark rounded-xl px-4 py-3 text-sm font-bold">{v.featured?"Remover destaque":"Destacar"}</button>
            <button type="button" disabled={busy===v.id} onClick={()=>removeVehicle(v)}
              className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">Excluir</button>
          </div>
        </div>
      </article>)}
    </div>

    {!filtered.length&&<div className="mt-6 rounded-[24px] border border-dashed border-black/20 bg-white p-10 text-center">
      <p className="text-xl font-black">Nenhum veículo encontrado</p><p className="mt-2 text-sm text-neutral-500">Ajuste a busca ou os filtros.</p>
    </div>}
  </main></AdminGuard>;
}
