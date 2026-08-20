"use client";

import {FormEvent, useState} from "react";
import {supabase} from "@/lib/supabase";
import {Vehicle} from "@/lib/types";

const AMENITIES = [
  "Ar-condicionado",
  "Direção hidráulica",
  "Direção elétrica",
  "Vidros elétricos",
  "Travas elétricas",
  "Central multimídia",
  "Câmera de ré",
  "Sensor de estacionamento",
  "Bancos em couro",
  "Piloto automático",
  "Chave presencial",
  "Teto solar",
];

export default function VehicleForm({initial}:{initial?:Vehicle}) {
  const [form, setForm] = useState({
    brand: initial?.brand || "",
    model: initial?.model || "",
    version: initial?.version || "",
    slug: initial?.slug || "",
    year: initial?.year || 2026,
    model_year: initial?.model_year || 2026,
    mileage: initial?.mileage || 0,
    price: initial?.price || 0,
    transmission: initial?.transmission || "Automático",
    fuel: initial?.fuel || "Flex",
    color: initial?.color || "",
    description: initial?.description || "",
    optional_items: initial?.optional_items || [] as string[],
    status: initial?.status || "available",
    featured: initial?.featured || false,
  });

  const [files, setFiles] = useState<FileList | null>(null);
  const [message, setMessage] = useState("");

  function setField(name:string, value:any) {
    setForm(current => ({...current, [name]: value}));
  }

  function toggleAmenity(item:string) {
    setForm(current => ({
      ...current,
      optional_items: current.optional_items.includes(item)
        ? current.optional_items.filter(x => x !== item)
        : [...current.optional_items, item],
    }));
  }

  async function save(e:FormEvent) {
    e.preventDefault();
    setMessage("Salvando...");

    const payload = {
      ...form,
      year: Number(form.year),
      model_year: Number(form.model_year),
      mileage: Number(form.mileage),
      price: Number(form.price),
    };

    let vehicleId = initial?.id;

    if (initial) {
      const {error} = await supabase.from("vehicles").update(payload).eq("id", initial.id);
      if (error) {
        setMessage(error.message);
        return;
      }
    } else {
      const {data, error} = await supabase.from("vehicles").insert(payload).select("id").single();
      if (error) {
        setMessage(error.message);
        return;
      }
      vehicleId = data.id;
    }

    if (files && vehicleId) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop();
        const path = `${vehicleId}/${Date.now()}-${i}.${ext}`;

        const upload = await supabase.storage.from("vehicle-images").upload(path, file);
        if (upload.error) {
          setMessage(`Veículo salvo, mas houve erro em uma foto: ${upload.error.message}`);
          return;
        }

        const publicUrl = supabase.storage.from("vehicle-images").getPublicUrl(path).data.publicUrl;
        const imageInsert = await supabase.from("vehicle_images").insert({
          vehicle_id: vehicleId,
          url: publicUrl,
          sort_order: i,
        });

        if (imageInsert.error) {
          setMessage(`Veículo salvo, mas houve erro ao registrar uma foto: ${imageInsert.error.message}`);
          return;
        }
      }
    }

    window.location.href = "/admin";
  }

  function input(name:string, label:string, type="text") {
    return (
      <label>
        <span className="text-sm font-bold">{label}</span>
        <input
          type={type}
          className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3"
          value={(form as any)[name]}
          onChange={e => setField(name, e.target.value)}
          required={["brand","model","slug","year","mileage","price"].includes(name)}
        />
      </label>
    );
  }

  return (
    <form onSubmit={save} className="mt-8 grid gap-5 rounded-[28px] border border-black/10 bg-white p-6 md:grid-cols-2">
      {input("brand","Marca")}
      {input("model","Modelo")}
      {input("version","Versão")}
      {input("slug","Slug (ex.: onix-ltz-2022)")}
      {input("year","Ano","number")}
      {input("model_year","Ano modelo","number")}
      {input("mileage","Quilometragem","number")}
      {input("price","Preço","number")}
      {input("color","Cor")}

      <label>
        <span className="text-sm font-bold">Câmbio</span>
        <select
          className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3"
          value={form.transmission}
          onChange={e => setField("transmission", e.target.value)}
        >
          <option>Automático</option>
          <option>Manual</option>
        </select>
      </label>

      <label>
        <span className="text-sm font-bold">Combustível</span>
        <select
          className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3"
          value={form.fuel}
          onChange={e => setField("fuel", e.target.value)}
        >
          <option>Flex</option>
          <option>Gasolina</option>
          <option>Diesel</option>
          <option>Elétrico</option>
          <option>Híbrido</option>
        </select>
      </label>

      <div className="md:col-span-2">
        <span className="text-sm font-bold">Comodidades</span>
        <p className="mt-1 text-sm text-neutral-500">
          Marque tudo que o veículo possui. Essas opções serão usadas nos filtros do estoque.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {AMENITIES.map(item => {
            const active = form.optional_items.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleAmenity(item)}
                className={
                  active
                    ? "btn-yellow rounded-full px-4 py-2.5 text-sm font-bold"
                    : "btn-outline-dark rounded-full px-4 py-2.5 text-sm font-bold"
                }
              >
                {active ? "✓ " : ""}{item}
              </button>
            );
          })}
        </div>
      </div>

      <label className="md:col-span-2">
        <span className="text-sm font-bold">Descrição</span>
        <textarea
          className="mt-2 min-h-32 w-full rounded-2xl border border-black/10 px-4 py-3"
          value={form.description}
          onChange={e => setField("description", e.target.value)}
        />
      </label>

      <label className="md:col-span-2">
        <span className="text-sm font-bold">Fotos</span>
        <input
          type="file"
          multiple
          accept="image/*"
          className="mt-2 block w-full rounded-2xl border border-black/10 p-3"
          onChange={e => setFiles(e.target.files)}
        />
      </label>

      <label>
        <span className="text-sm font-bold">Status</span>
        <select
          className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3"
          value={form.status}
          onChange={e => setField("status", e.target.value)}
        >
          <option value="available">Disponível</option>
          <option value="sold">Vendido</option>
        </select>
      </label>

      <label className="flex items-center gap-3 pt-7">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={e => setField("featured", e.target.checked)}
        />
        <span className="font-bold">Destaque na Home</span>
      </label>

      <div className="md:col-span-2 flex flex-wrap items-center gap-4">
        <button className="btn-dark rounded-2xl px-6 py-4 font-bold">Salvar veículo</button>
        <a href="/admin" className="btn-outline-dark rounded-2xl px-6 py-4 font-bold">Cancelar</a>
        {message && <span className="text-sm text-neutral-600">{message}</span>}
      </div>
    </form>
  );
}
