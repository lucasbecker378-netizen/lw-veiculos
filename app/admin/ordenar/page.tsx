"use client";

import { DragEvent, useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";
import { Vehicle } from "@/lib/types";
import { money } from "@/lib/format";

export default function OrdenarEstoque() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("status", "available")
      .order("display_order", {
        ascending: true,
        nullsFirst: false,
      })
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
    } else {
      setVehicles((data || []) as Vehicle[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function moveVehicle(fromId: string, toId: string) {
    if (fromId === toId) return;

    setVehicles((current) => {
      const from = current.findIndex((v) => v.id === fromId);
      const to = current.findIndex((v) => v.id === toId);

      if (from < 0 || to < 0) return current;

      const updated = [...current];
      const [vehicle] = updated.splice(from, 1);

      updated.splice(to, 0, vehicle);

      return updated;
    });
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    targetId: string
  ) {
    event.preventDefault();

    if (draggedId) {
      moveVehicle(draggedId, targetId);
    }

    setDraggedId(null);
  }

  function moveButton(id: string, direction: -1 | 1) {
    setVehicles((current) => {
      const index = current.findIndex((v) => v.id === id);
      const target = index + direction;

      if (
        index < 0 ||
        target < 0 ||
        target >= current.length
      ) {
        return current;
      }

      const updated = [...current];

      [updated[index], updated[target]] = [
        updated[target],
        updated[index],
      ];

      return updated;
    });
  }

  async function saveOrder() {
    setSaving(true);
    setMessage("");

    for (let i = 0; i < vehicles.length; i++) {
      const { error } = await supabase
        .from("vehicles")
        .update({
          display_order: i + 1,
        })
        .eq("id", vehicles[i].id);

      if (error) {
        alert(
          "Erro ao salvar a ordem: " +
            error.message
        );

        setSaving(false);
        return;
      }
    }

    setVehicles((current) =>
      current.map((vehicle, index) => ({
        ...vehicle,
        display_order: index + 1,
      }))
    );

    setSaving(false);
    setMessage("Ordem salva com sucesso!");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  return (
    <AdminGuard>
      <main className="container py-7 sm:py-12">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#9a8400]">
              Painel administrativo
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Ordenar estoque
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Os veículos que estiverem no topo aparecem
              primeiro no site.
            </p>
          </div>

          <div className="flex gap-2">

            <a
              href="/admin"
              className="btn-outline-dark rounded-xl px-5 py-3 font-bold"
            >
              Voltar
            </a>

            <button
              onClick={saveOrder}
              disabled={saving}
              className="btn-yellow rounded-xl px-5 py-3 font-black disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar ordem"}
            </button>

          </div>

        </div>

        {message && (
          <div className="mt-5 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        <section className="mt-7 rounded-[24px] border border-black/10 bg-white p-3 sm:p-5">

          {loading ? (
            <p className="p-8 text-center text-neutral-500">
              Carregando veículos...
            </p>
          ) : (

            <div className="grid gap-3">

              {vehicles.map((vehicle, index) => (

                <div
                  key={vehicle.id}
                  draggable
                  onDragStart={() =>
                    setDraggedId(vehicle.id)
                  }
                  onDragOver={(e) =>
                    e.preventDefault()
                  }
                  onDrop={(e) =>
                    handleDrop(e, vehicle.id)
                  }
                  onDragEnd={() =>
                    setDraggedId(null)
                  }
                  className={`
                    flex items-center gap-3
                    rounded-2xl border p-3
                    sm:p-4
                    ${
                      draggedId === vehicle.id
                        ? "border-[#d6bd00] bg-[#fffbe6] opacity-60"
                        : "border-black/10 bg-[#fafaf7]"
                    }
                  `}
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black font-black text-white">
                    {index + 1}
                  </div>

                  <div
                    className="hidden cursor-grab select-none text-2xl text-neutral-400 sm:block"
                    title="Arrastar"
                  >
                    ☰
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="truncate font-black">
                      {vehicle.brand}{" "}
                      {vehicle.model}{" "}
                      {vehicle.version}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {vehicle.year}/
                      {vehicle.model_year ||
                        vehicle.year}
                      {" · "}
                      {money(vehicle.price)}
                    </p>

                  </div>

                  <div className="flex gap-1">

                    <button
                      type="button"
                      onClick={() =>
                        moveButton(
                          vehicle.id,
                          -1
                        )
                      }
                      disabled={index === 0}
                      className="rounded-lg border border-black/10 bg-white px-3 py-2 font-black disabled:opacity-30"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        moveButton(
                          vehicle.id,
                          1
                        )
                      }
                      disabled={
                        index ===
                        vehicles.length - 1
                      }
                      className="rounded-lg border border-black/10 bg-white px-3 py-2 font-black disabled:opacity-30"
                    >
                      ↓
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        <div className="sticky bottom-4 mt-5 flex justify-end">

          <button
            onClick={saveOrder}
            disabled={saving}
            className="btn-yellow rounded-xl px-6 py-4 font-black shadow-xl disabled:opacity-50"
          >
            {saving
              ? "Salvando..."
              : "Salvar ordem do estoque"}
          </button>

        </div>

      </main>
    </AdminGuard>
  );
}