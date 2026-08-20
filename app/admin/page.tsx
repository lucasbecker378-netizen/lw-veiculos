"use client";

import {useEffect,useState} from "react";
import AdminGuard from "@/components/AdminGuard";
import {supabase} from "@/lib/supabase";
import {Vehicle} from "@/lib/types";
import {money} from "@/lib/format";

export default function Admin(){
  const [vehicles,setVehicles]=useState<Vehicle[]>([]);

  const load=()=>supabase
    .from("vehicles")
    .select("*")
    .order("created_at",{ascending:false})
    .then(({data})=>setVehicles((data||[]) as Vehicle[]));

  useEffect(()=>{load()},[]);

  async function removeVehicle(id:string){
    if(!confirm("Excluir este veículo?")) return;
    await supabase.from("vehicles").delete().eq("id",id);
    load();
  }

  async function logout(){
    await supabase.auth.signOut();
    window.location.href="/admin/login";
  }

  return (
    <AdminGuard>
      <main className="container py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.14em] text-neutral-500">LW Veículos</p>
            <h1 className="mt-2 text-4xl font-black">Estoque administrativo</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href="/admin/veiculos/novo" className="btn-dark rounded-xl px-5 py-3 font-bold">+ Novo veículo</a>
            <button onClick={logout} className="btn-outline-dark rounded-xl px-5 py-3 font-bold">Sair do painel</button>
          </div>
        </div>

        <div className="mt-10 overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b bg-neutral-50 text-xs font-black uppercase tracking-[.08em] text-neutral-500">
              <tr>
                <th className="p-4">Código</th>
                <th className="p-4">Veículo</th>
                <th className="p-4">Ano</th>
                <th className="p-4">Preço</th>
                <th className="p-4">Status</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v=>(
                <tr key={v.id} className="border-b last:border-0">
                  <td className="p-4">
                    <span className="rounded-full bg-[#ffe331] px-3 py-1.5 text-xs font-black text-black">
                      {v.vehicle_code || "—"}
                    </span>
                  </td>
                  <td className="p-4 font-bold">{v.brand} {v.model} {v.version}</td>
                  <td className="p-4">{v.year}/{v.model_year||v.year}</td>
                  <td className="p-4">{money(v.price)}</td>
                  <td className="p-4">{v.status==="available"?"Disponível":"Vendido"}</td>
                  <td className="p-4">
                    <a className="mr-4 font-bold" href={`/admin/veiculos/${v.id}`}>Editar</a>
                    <button onClick={()=>removeVehicle(v.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!vehicles.length && (
          <div className="mt-6 rounded-2xl border border-dashed border-black/20 bg-white p-8 text-neutral-600">
            Nenhum veículo cadastrado ainda.
          </div>
        )}
      </main>
    </AdminGuard>
  );
}
