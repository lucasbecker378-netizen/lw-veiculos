"use client";

import {useEffect, useMemo, useState} from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VehicleCard from "@/components/VehicleCard";
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

export default function Estoque() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [brand, setBrand] = useState("");
  const [transmission, setTransmission] = useState("");
  const [maxPrice, setMaxPrice] = useState(200000);
  const [amenities, setAmenities] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("vehicles")
      .select("*")
      .eq("status", "available")
      .order("created_at", {ascending: false})
      .then(({data}) => setVehicles((data || []) as Vehicle[]));
  }, []);

  const brands = useMemo(
    () => [...new Set(vehicles.map(v => v.brand).filter(Boolean))].sort((a,b) => a.localeCompare(b, "pt-BR")),
    [vehicles]
  );

  const priceCeiling = useMemo(() => {
    const highest = vehicles.length ? Math.max(...vehicles.map(v => Number(v.price) || 0)) : 200000;
    return Math.max(50000, Math.ceil(highest / 10000) * 10000);
  }, [vehicles]);

  useEffect(() => {
    setMaxPrice(priceCeiling);
  }, [priceCeiling]);

  const formattedMaxPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(maxPrice);

  const filtered = useMemo(() => {
    return vehicles.filter(v => {
      const priceOk = Number(v.price) <= maxPrice;
      const brandOk = !brand || v.brand === brand;
      const transmissionOk = !transmission || v.transmission === transmission;
      const vehicleAmenities = v.optional_items || [];
      const amenitiesOk = amenities.every(item => vehicleAmenities.includes(item));
      return priceOk && brandOk && transmissionOk && amenitiesOk;
    });
  }, [vehicles, maxPrice, brand, transmission, amenities]);

  function toggleAmenity(item: string) {
    setAmenities(current =>
      current.includes(item)
        ? current.filter(x => x !== item)
        : [...current, item]
    );
  }

  function clearFilters() {
    setBrand("");
    setTransmission("");
    setMaxPrice(priceCeiling);
    setAmenities([]);
  }

  const hasFilters = Boolean(brand || transmission || maxPrice < priceCeiling || amenities.length);

  return (
    <>
      <Header />

      <main>
        <section className="bg-black py-16 text-white">
          <div className="container">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#ffe331]">LW Veículos</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight">Estoque</h1>
            <p className="mt-4 max-w-xl text-neutral-300">
              Filtre por valor, marca, câmbio e comodidades para encontrar o veículo ideal.
            </p>
          </div>
        </section>

        <section className="container py-12">
          <div className="rounded-[30px] border border-black/10 bg-white p-6 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="flex min-h-[148px] flex-col rounded-[24px] border border-black/10 bg-[#fafaf7] p-5">
                <span className="text-xs font-black uppercase tracking-[.12em] text-neutral-500">Valor máximo</span>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="text-sm text-neutral-500">Até</span>
                  <strong className="text-xl text-black">{formattedMaxPrice}</strong>
                </div>
                <input
                  type="range"
                  min="10000"
                  max={priceCeiling}
                  step="5000"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="mt-4 w-full accent-[#d6bd00]"
                  aria-label="Valor máximo do veículo"
                />
                <div className="mt-2 flex justify-between text-xs text-neutral-400">
                  <span>R$ 10 mil</span>
                  <span>{new Intl.NumberFormat("pt-BR", {style:"currency", currency:"BRL", maximumFractionDigits:0}).format(priceCeiling)}</span>
                </div>
              </div>

              <label className="flex min-h-[148px] flex-col rounded-[24px] border border-black/10 bg-[#fafaf7] p-5">
                <span className="text-xs font-black uppercase tracking-[.12em] text-neutral-500">Marca</span>
                <select
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="mt-4 min-h-[54px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                >
                  <option value="">Todas as marcas</option>
                  {brands.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
                <p className="mt-auto pt-3 text-xs text-neutral-400">Selecione a fabricante desejada</p>
              </label>

              <label className="flex min-h-[148px] flex-col rounded-[24px] border border-black/10 bg-[#fafaf7] p-5">
                <span className="text-xs font-black uppercase tracking-[.12em] text-neutral-500">Câmbio</span>
                <select
                  value={transmission}
                  onChange={e => setTransmission(e.target.value)}
                  className="mt-4 min-h-[54px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                >
                  <option value="">Todos os câmbios</option>
                  <option value="Manual">Manual</option>
                  <option value="Automático">Automático</option>
                </select>
                <p className="mt-auto pt-3 text-xs text-neutral-400">Escolha o tipo de transmissão</p>
              </label>
            </div>

            <div className="mt-7 border-t border-black/10 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.12em] text-neutral-500">Comodidades</p>
                  <p className="mt-1 text-sm text-neutral-500">Selecione uma ou mais opções.</p>
                </div>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="btn-outline-dark rounded-full px-5 py-3 text-sm font-bold"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {AMENITIES.map(item => {
                  const active = amenities.includes(item);
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
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-neutral-500">
              <b className="text-black">{filtered.length}</b> veículo(s) encontrado(s)
            </p>
            {hasFilters && (
              <p className="text-xs font-bold uppercase tracking-[.12em] text-[#9a8400]">
                Filtros ativos
              </p>
            )}
          </div>

          {filtered.length ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(v => <VehicleCard key={v.id} vehicle={v}/>)}
            </div>
          ) : (
            <div className="mt-8 rounded-[28px] border border-dashed border-black/20 bg-white p-10">
              <h2 className="text-2xl font-black">Nenhum veículo encontrado.</h2>
              <p className="mt-2 text-neutral-600">
                Tente remover uma comodidade ou aumentar o valor máximo.
              </p>
              <button onClick={clearFilters} className="btn-dark mt-6 rounded-full px-6 py-4 font-bold">
                Limpar filtros
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer/>
    </>
  );
}
