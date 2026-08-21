"use client";

import {useEffect,useState} from "react";
import AdminGuard from "@/components/AdminGuard";
import {supabase} from "@/lib/supabase";
import {Vehicle} from "@/lib/types";
import {money} from "@/lib/format";

export default function Admin(){
  const [vehicles,setVehicles]=useState<Vehicle[]>([]);
  const [deleting,setDeleting]=useState<string|null>(null);

  const load=()=>supabase
    .from("vehicles")
    .select("*")
    .order("created_at",{ascending:false})
    .then(({data})=>setVehicles((data||[]) as Vehicle[]));

  useEffect(()=>{load()},[]);

  async function removeVehicle(vehicle:Vehicle){
    const name=[vehicle.brand,vehicle.model,vehicle.version].filter(Boolean).join(" ");
    if(!confirm(`Excluir ${name}?\n\nEssa ação não poderá ser desfeita.`)) return;

    setDeleting(vehicle.id);
    const {error}=await supabase.from("vehicles").delete().eq("id",vehicle.id);
    setDeleting(null);

    if(error){
      alert(`Não foi possível excluir o veículo: ${error.message}`);
      return;
    }

    load();
  }

  async function logout(){
    await supabase.auth.signOut();
    window.location.href="/admin/login";
  }

  const available=vehicles.filter(v=>v.status==="available").length;
  const sold=vehicles.filter(v=>v.status==="sold").length;

  return (
    <AdminGuard>
      <main className="container py-10 sm:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#9a8400]">Painel administrativo</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Estoque LW Veículos</h1>
            <p className="mt-2 text-sm text-neutral-500">Cadastre, edite e gerencie os veículos publicados no site.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href="/admin/veiculos/novo" className="btn-yellow rounded-xl px-5 py-3 font-black">+ Novo veículo</a>
            <button onClick={logout} className="btn-outline-dark rounded-xl px-5 py-3 font-bold">Sair</button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[.1em] text-neutral-500">Total</p>
            <p className="mt-2 text-3xl font-black">{vehicles.length}</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[.1em] text-neutral-500">Disponíveis</p>
            <p className="mt-2 text-3xl font-black">{available}</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[.1em] text-neutral-500">Vendidos</p>
            <p className="mt-2 text-3xl font-black">{sold}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {vehicles.map(v=>(
            <article key={v.id} className="rounded-[22px] border border-black/10 bg-white p-5 transition hover:border-black/20">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {v.vehicle_code&&(
                      <span className="rounded-full bg-[#ffe331] px-3 py-1 text-xs font-black text-black">{v.vehicle_code}</span>
                    )}
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      v.status==="available"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-neutral-100 text-neutral-600"
                    }`}>
                      {v.status==="available"?"Disponível":"Vendido"}
                    </span>
                    {v.featured&&(
                      <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">Destaque</span>
                    )}
                  </div>

                  <h2 className="mt-3 truncate text-xl font-black sm:text-2xl">
                    {v.brand} {v.model} {v.version}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-500">
                    <span>{v.year}/{v.model_year||v.year}</span>
                    <span>{v.transmission || "Câmbio não identificado"}</span>
                    <span>{v.fuel || "Combustível não identificado"}</span>
                    <strong className="text-black">{money(v.price)}</strong>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <a
                    href={`/admin/veiculos/${v.id}`}
                    className="btn-dark inline-flex min-w-[110px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
                  >
                    Editar
                  </a>
                  <button
                    type="button"
                    onClick={()=>removeVehicle(v)}
                    disabled={deleting===v.id}
                    className="inline-flex min-w-[110px] items-center justify-center rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleting===v.id?"Excluindo...":"Excluir"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!vehicles.length&&(
          <div className="mt-8 rounded-[24px] border border-dashed border-black/20 bg-white p-10 text-center">
            <p className="text-xl font-black">Nenhum veículo cadastrado</p>
            <p className="mt-2 text-sm text-neutral-500">Clique em “+ Novo veículo” para adicionar o primeiro.</p>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}
