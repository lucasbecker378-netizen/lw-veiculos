"use client";

import {FormEvent, useEffect, useMemo, useState} from "react";
import {supabase} from "@/lib/supabase";
import {Vehicle} from "@/lib/types";

const AMENITIES = [
  "Ar-condicionado",
  "Direção hidráulica",
  "Direção elétrica",
  "Vidros elétricos",
  "Travas elétricas",
  "Retrovisores elétricos",
  "Bancos em couro",
  "Piloto automático",
  "Central multimídia",
  "Multimídia original",
  "Câmera de ré",
  "Sensor de estacionamento",
  "Chave presencial",
  "Chave reserva",
  "Manual do usuário",
  "Faróis de neblina",
  "Volante escamoteável",
  "Rodas de liga leve",
  "Teto solar",
  "Placas Mercosul",
];

const BRAND_NAMES = [
  "Alfa Romeo","Aston Martin","Land Rover","Mercedes-Benz","Mercedes Benz",
  "Chevrolet","Volkswagen","Volkswagem","Toyota","Honda","Hyundai","Fiat",
  "Ford","Renault","Nissan","Jeep","Citroën","Citroen","Peugeot","BMW","Audi",
  "Volvo","Mitsubishi","Kia","Suzuki","Subaru","Porsche","Ram","Chery","Caoa Chery",
  "BYD","GWM","Mini","Lexus","JAC","Jac Motors"
].sort((a,b)=>b.length-a.length);

function normalize(s:string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu," ")
    .trim();
}

function slugify(s:string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"");
}

function parseBRL(value:string) {
  const cleaned = value.replace(/[^\d.,]/g,"").trim();
  if (!cleaned) return 0;
  if (cleaned.includes(",")) {
    return Number(cleaned.replace(/\./g,"").replace(",", ".")) || 0;
  }
  return Number(cleaned.replace(/\./g,"")) || 0;
}

function matchAmenity(line:string) {
  const n = normalize(line);

  const aliases:[string,string[]][] = [
    ["Ar-condicionado",["ar condicionado","ar-condicionado"]],
    ["Direção hidráulica",["direcao hidraulica"]],
    ["Direção elétrica",["direcao eletrica"]],
    ["Vidros elétricos",["vidros eletricos","vidro eletrico"]],
    ["Travas elétricas",["travas eletricas","trava eletrica"]],
    ["Retrovisores elétricos",["retrovisores eletricos","retrovisor eletrico"]],
    ["Bancos em couro",["bancos de couro","banco de couro","bancos em couro","banco em couro"]],
    ["Piloto automático",["piloto automatico","controle de cruzeiro","cruise control"]],
    ["Central multimídia",["central multimidia"]],
    ["Multimídia original",["multimidia original"]],
    ["Câmera de ré",["camera de re"]],
    ["Sensor de estacionamento",["sensor de estacionamento","sensores de estacionamento"]],
    ["Chave presencial",["chave presencial"]],
    ["Chave reserva",["chave reserva"]],
    ["Manual do usuário",["manual do usuario","manual do proprietário","manual do proprietario"]],
    ["Faróis de neblina",["farois de neblina","farol de neblina"]],
    ["Volante escamoteável",["volante escamoteavel"]],
    ["Rodas de liga leve",["rodas de liga leve","roda de liga leve"]],
    ["Teto solar",["teto solar"]],
    ["Placas Mercosul",["placas mercosul","placa mercosul"]],
  ];

  for (const [canonical, names] of aliases) {
    if (names.some(x => n === normalize(x) || n.includes(normalize(x)))) return canonical;
  }
  return null;
}

function parseQuickText(raw:string) {
  const lines = raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if (!lines.length) return null;

  const title = lines[0];
  const titleNorm = normalize(title);
  const fullNorm = normalize(lines.join(" "));

  const transmission =
    /\b(manual|mecanico|mecanica)\b/.test(fullNorm) ? "Manual" :
    /\b(automatico|automatica|aut|at)\b/.test(fullNorm) ? "Automático" : "";

  const fuel =
    /\bdiesel\b/.test(fullNorm) ? "Diesel" :
    /\b(flex|flexfuel|flex fuel)\b/.test(fullNorm) ? "Flex" :
    /\bgasolina\b/.test(fullNorm) ? "Gasolina" :
    /\b(etanol|alcool)\b/.test(fullNorm) ? "Etanol" :
    /\b(hibrido|hibrida)\b/.test(fullNorm) ? "Híbrido" :
    /\b(eletrico|eletrica)\b/.test(fullNorm) ? "Elétrico" : "";

  const yearMatch = title.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? Number(yearMatch[0]) : 0;

  let brand = "";
  for (const candidate of BRAND_NAMES) {
    if (normalize(title).startsWith(normalize(candidate) + " ") || normalize(title) === normalize(candidate)) {
      brand = candidate;
      break;
    }
  }
  if (!brand) brand = title.split(/\s+/)[0] || "";

  let remaining = title;
  const brandRegex = new RegExp("^" + brand.replace(/[.*+?^${}()|[\]\\]/g,"\\$&") + "\\s*", "i");
  remaining = remaining.replace(brandRegex,"").trim();
  if (yearMatch) remaining = remaining.replace(yearMatch[0]," ").trim();
  remaining = remaining
    .replace(/\bautom[aá]tico\b/ig," ")
    .replace(/\bmanual\b/ig," ")
    .replace(/\s+/g," ")
    .trim();

  const parts = remaining.split(/\s+/).filter(Boolean);
  let model = "";
  let version = "";

  if (parts.length) {
    model = parts[0];
    version = parts.slice(1).join(" ");
  }

  // Price: prioritize a final money-looking line.
  let price = 0;
  let priceIndex = -1;
  for (let i=lines.length-1;i>=1;i--) {
    if (/^(R\$\s*)?[\d.]+,\d{2}$/.test(lines[i]) || /^(R\$\s*)?\d{4,}$/.test(lines[i])) {
      price = parseBRL(lines[i]);
      priceIndex = i;
      break;
    }
  }

  const foundAmenities:string[] = [];
  const leftovers:string[] = [];

  lines.slice(1).forEach((line, idx) => {
    const actualIndex = idx + 1;
    if (actualIndex === priceIndex) return;
    const amenity = matchAmenity(line);
    if (amenity) {
      if (!foundAmenities.includes(amenity)) foundAmenities.push(amenity);
    } else {
      leftovers.push(line);
    }
  });

  const description = leftovers.join("\n");

  return {
    brand,
    model,
    version,
    year,
    transmission,
    fuel,
    price,
    optional_items: foundAmenities,
    description,
  };
}


function formatPrice(value:number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatPriceField(value:number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function generateProfessionalDescription(data:{
  brand:string;
  model:string;
  version:string;
  year:number;
  model_year:number;
  price:number;
  transmission:string;
  fuel:string;
  color:string;
  optional_items:string[];
}) {
  const vehicleName = [data.brand, data.model, data.version].filter(Boolean).join(" ").trim();
  const yearText = data.model_year && data.model_year !== data.year
    ? `${data.year}/${data.model_year}`
    : `${data.year}`;

  const intro = `${vehicleName} ${yearText}${data.transmission ? ` ${data.transmission}` : ""} à venda na LW Veículos, em Venâncio Aires - RS.`;

  const equipmentText = data.optional_items.length
    ? `Entre os principais itens e comodidades, este veículo conta com ${data.optional_items
        .map((item, index) => {
          if (index === data.optional_items.length - 1 && data.optional_items.length > 1) return `e ${item.toLowerCase()}`;
          return item.toLowerCase();
        })
        .join(data.optional_items.length > 2 ? ", " : " ")}.`
    : "";

  const details = [
    data.transmission ? `câmbio ${data.transmission.toLowerCase()}` : "",
    data.fuel ? `combustível ${data.fuel.toLowerCase()}` : "",
    data.color ? `cor ${data.color.toLowerCase()}` : "",
  ].filter(Boolean);

  const detailsText = details.length
    ? `Uma opção para quem procura um veículo ${details.join(", ")} e com informações apresentadas de forma clara para facilitar sua decisão de compra.`
    : `Uma opção para quem busca um veículo com informações claras e atendimento direto durante a negociação.`;

  const priceText = data.price
    ? `${vehicleName} ${yearText} por ${formatPrice(data.price)}.`
    : "";

  const cta = `Entre em contato com a LW Veículos para consultar disponibilidade, condições de negociação, troca e financiamento. Atendimento em Venâncio Aires e região.`;

  return [intro, detailsText, equipmentText, priceText, cta]
    .filter(Boolean)
    .join("\n\n");
}

function generateSeoPreview(data:{
  brand:string;
  model:string;
  version:string;
  year:number;
  model_year:number;
  transmission:string;
}) {
  const vehicleName = [data.brand, data.model, data.version].filter(Boolean).join(" ").trim();
  const yearText = data.model_year && data.model_year !== data.year
    ? `${data.year}/${data.model_year}`
    : `${data.year}`;

  const title = `${vehicleName} ${yearText}${data.transmission ? ` ${data.transmission}` : ""} em Venâncio Aires | LW Veículos`;
  const description = `${vehicleName} ${yearText}${data.transmission ? ` ${data.transmission}` : ""} à venda na LW Veículos em Venâncio Aires - RS. Confira fotos, equipamentos, preço e fale com nossa equipe.`;

  return {title, description};
}

export default function VehicleForm({initial}:{initial?:Vehicle}) {
  const [quickText, setQuickText] = useState("");
  const [parseNotice, setParseNotice] = useState("");
  const [form, setForm] = useState({
    brand: initial?.brand || "",
    model: initial?.model || "",
    version: initial?.version || "",
    slug: initial?.slug || "",
    year: initial?.year || 2026,
    model_year: initial?.model_year || 2026,
    price: initial?.price || 0,
    transmission: initial?.transmission || "",
    fuel: initial?.fuel || "",
    color: initial?.color || "",
    description: initial?.description || "",
    optional_items: initial?.optional_items || [] as string[],
    status: initial?.status || "available",
    featured: initial?.featured || false,
  });

  const [priceText, setPriceText] = useState(() => formatPriceField(Number(initial?.price || 0)));

  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{id:string;url:string;sort_order:number}[]>([]);
  const [message, setMessage] = useState("");
  const [seoPreview, setSeoPreview] = useState<{title:string;description:string}|null>(null);
  const [draggingFileIndex, setDraggingFileIndex] = useState<number|null>(null);
  const [draggingExistingIndex, setDraggingExistingIndex] = useState<number|null>(null);

  const photoPreviews = useMemo(() => {
    return files.map((file, index) => ({
      file,
      name:file.name,
      url:URL.createObjectURL(file),
      index,
    }));
  }, [files]);

  useEffect(() => {
    setPriceText(formatPriceField(Number(form.price || 0)));
  }, [form.price]);

  useEffect(() => {
    if (!initial?.id) return;

    supabase
      .from("vehicle_images")
      .select("id,url,sort_order")
      .eq("vehicle_id", initial.id)
      .order("sort_order")
      .then(({data}) => {
        setExistingImages((data || []) as {id:string;url:string;sort_order:number}[]);
      });
  }, [initial?.id]);

  const missing = useMemo(() => {
    const items:string[] = [];
    if (!form.brand) items.push("marca");
    if (!form.model) items.push("modelo");
    if (!form.year) items.push("ano");
    if (!parseBRL(priceText)) items.push("preço");
    if (!form.color) items.push("cor");
    if (!form.transmission) items.push("câmbio");
    if (!form.fuel) items.push("combustível");
    return items;
  }, [form]);

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

  function reorderArray<T>(items:T[], from:number, to:number) {
    const copy = [...items];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  }

  function moveFile(from:number, to:number) {
    if (to < 0 || to >= files.length || from === to) return;
    setFiles(current => reorderArray(current, from, to));
  }

  function moveExistingImage(from:number, to:number) {
    if (to < 0 || to >= existingImages.length || from === to) return;
    setExistingImages(current => reorderArray(current, from, to));
  }

  function handleFileDrop(targetIndex:number) {
    if (draggingFileIndex === null) return;
    moveFile(draggingFileIndex, targetIndex);
    setDraggingFileIndex(null);
  }

  function handleExistingDrop(targetIndex:number) {
    if (draggingExistingIndex === null) return;
    moveExistingImage(draggingExistingIndex, targetIndex);
    setDraggingExistingIndex(null);
  }

  function interpretQuickText() {
    const parsed = parseQuickText(quickText);
    if (!parsed) {
      setParseNotice("Cole os dados recebidos antes de interpretar.");
      return;
    }

    const generatedSlug = slugify(
      [parsed.brand, parsed.model, parsed.version, parsed.year].filter(Boolean).join(" ")
    );

    setForm(current => ({
      ...current,
      brand: parsed.brand || current.brand,
      model: parsed.model || current.model,
      version: parsed.version || current.version,
      slug: generatedSlug || current.slug,
      year: parsed.year || current.year,
      model_year: parsed.year || current.model_year,
      price: parsed.price || current.price,
      transmission: parsed.transmission || current.transmission,
      fuel: parsed.fuel || current.fuel,
      optional_items: parsed.optional_items.length ? parsed.optional_items : current.optional_items,
      description: parsed.description || current.description,
    }));

    const recognized = [
      parsed.brand && `marca: ${parsed.brand}`,
      parsed.model && `modelo: ${parsed.model}`,
      parsed.version && `versão: ${parsed.version}`,
      parsed.year && `ano: ${parsed.year}`,
      parsed.transmission && `câmbio: ${parsed.transmission}`,
      parsed.fuel && `combustível: ${parsed.fuel}`,
      parsed.price && `preço: R$ ${parsed.price.toLocaleString("pt-BR")}`,
      parsed.optional_items.length && `${parsed.optional_items.length} comodidade(s)`,
    ].filter(Boolean).join(" · ");

    setParseNotice(recognized ? `Interpretado: ${recognized}. Revise os campos antes de salvar.` : "Não consegui identificar os dados principais. Preencha manualmente.");
  }


  function generateDescriptionAndSeo() {
    const description = generateProfessionalDescription({
      brand: form.brand,
      model: form.model,
      version: form.version,
      year: Number(form.year),
      model_year: Number(form.model_year),
      price: parseBRL(priceText),
      transmission: form.transmission,
      fuel: form.fuel,
      color: form.color,
      optional_items: form.optional_items,
    });

    setField("description", description);

    setSeoPreview(generateSeoPreview({
      brand: form.brand,
      model: form.model,
      version: form.version,
      year: Number(form.year),
      model_year: Number(form.model_year),
      transmission: form.transmission,
    }));
  }

  async function save(e:FormEvent) {
    e.preventDefault();

    if (!form.transmission || !form.fuel) {
      setMessage("Confirme o câmbio e o combustível antes de publicar o veículo.");
      return;
    }

    setMessage("Salvando...");

    const payload = {
      ...form,
      year: Number(form.year),
      model_year: Number(form.model_year),
      mileage: 0,
      price: parseBRL(priceText),
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

    if (initial && existingImages.length) {
      for (let i = 0; i < existingImages.length; i++) {
        const {error: orderError} = await supabase
          .from("vehicle_images")
          .update({sort_order:i})
          .eq("id", existingImages[i].id);

        if (orderError) {
          setMessage(`Veículo salvo, mas não foi possível atualizar a ordem das fotos: ${orderError.message}`);
          return;
        }
      }
    }

    if (files.length && vehicleId) {
      const startOrder = existingImages.length;
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
          sort_order: startOrder + i,
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
          required={["brand","model","slug","year","price"].includes(name)}
        />
      </label>
    );
  }

  return (
    <form onSubmit={save} className="mt-8 grid gap-6 rounded-[28px] border border-black/10 bg-white p-6 md:grid-cols-2">

      {!initial && (
        <section className="md:col-span-2 rounded-[24px] border border-[#d6bd00]/30 bg-[#fffbe2] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-[#8a7700]">Cadastro rápido</p>
              <h2 className="mt-2 text-2xl font-black">Cole os dados recebidos do veículo</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
                O painel identifica marca, modelo, versão, ano, câmbio, preço e comodidades. Depois você apenas revisa o que estiver faltando.
              </p>
            </div>
          </div>

          <textarea
            className="mt-5 min-h-64 w-full rounded-2xl border border-black/10 bg-white px-4 py-4 leading-7"
            value={quickText}
            onChange={e => setQuickText(e.target.value)}
            placeholder={"Exemplo:\nHonda CR-V 2.0 2011 Automático\n\nAr Condicionado\nDireção Elétrica\nVidros Elétricos\nBancos de Couro\nPiloto Automático\nCâmera de Ré\n\n58.900,00"}
          />

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={interpretQuickText}
              className="btn-dark rounded-2xl px-6 py-4 font-bold"
            >
              Interpretar dados
            </button>
            {parseNotice && <p className="max-w-3xl text-sm leading-6 text-neutral-600">{parseNotice}</p>}
          </div>
        </section>
      )}

      <div className="md:col-span-2">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.14em] text-neutral-500">Revisão</p>
            <h2 className="mt-1 text-2xl font-black">Dados do veículo</h2>
            <p className="mt-2 text-sm text-neutral-500">
              O código identificador do veículo será criado automaticamente ao salvar, no padrão LW-0001, LW-0002, LW-0003...
            </p>
          </div>
          {missing.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
              <b>Confira:</b> {missing.join(", ")}
            </div>
          )}
        </div>
      </div>

      {input("brand","Marca")}
      {input("model","Modelo")}
      {input("version","Versão")}
      {input("slug","Slug (endereço do anúncio)")}
      {input("year","Ano","number")}
      {input("model_year","Ano modelo","number")}
      <label>
        <span className="text-sm font-bold">Preço</span>
        <div className="mt-2 flex items-center rounded-2xl border border-black/10 bg-white px-4">
          <span className="mr-2 font-bold text-neutral-500">R$</span>
          <input
            type="text"
            inputMode="decimal"
            className="w-full bg-transparent py-3 outline-none"
            value={priceText}
            onChange={e => setPriceText(e.target.value.replace(/[^0-9.,]/g, ""))}
            onBlur={() => {
              const value = parseBRL(priceText);
              setField("price", value);
              setPriceText(formatPriceField(value));
            }}
            placeholder="39.900,00"
            required
          />
        </div>
        <p className="mt-1 text-xs text-neutral-500">Formato: 39.900,00</p>
      </label>
      {input("color","Cor")}

      <label>
        <span className="text-sm font-bold">Câmbio</span>
        <select
          className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3"
          value={form.transmission}
          onChange={e => setField("transmission", e.target.value)}
        >
          <option value="">Não identificado</option>
          <option value="Automático">Automático</option>
          <option value="Manual">Manual</option>
        </select>
        {!form.transmission && (
          <p className="mt-2 text-xs font-bold text-amber-700">Confirme esta informação antes de publicar.</p>
        )}
      </label>

      <label>
        <span className="text-sm font-bold">Combustível</span>
        <select
          className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3"
          value={form.fuel}
          onChange={e => setField("fuel", e.target.value)}
        >
          <option value="">Não identificado</option>
          <option value="Flex">Flex</option>
          <option value="Gasolina">Gasolina</option>
          <option value="Diesel">Diesel</option>
          <option value="Etanol">Etanol</option>
          <option value="Híbrido">Híbrido</option>
          <option value="Elétrico">Elétrico</option>
        </select>
        {!form.fuel && (
          <p className="mt-2 text-xs font-bold text-amber-700">Confirme esta informação antes de publicar.</p>
        )}
      </label>

      <div className="md:col-span-2">
        <span className="text-sm font-bold">Comodidades</span>
        <p className="mt-1 text-sm text-neutral-500">
          As identificadas no texto já ficam marcadas. Você pode corrigir ou adicionar outras.
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

      <div className="md:col-span-2 rounded-[24px] border border-black/10 bg-[#fafaf7] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-sm font-bold">Descrição profissional do anúncio</span>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-500">
              Gere uma descrição padronizada com marca, modelo, ano, câmbio, preço, comodidades e localização da LW Veículos, sem inventar informações.
            </p>
          </div>
          <button
            type="button"
            onClick={generateDescriptionAndSeo}
            className="btn-yellow rounded-2xl px-5 py-3 text-sm font-black"
          >
            Gerar descrição com SEO
          </button>
        </div>

        <textarea
          className="mt-4 min-h-64 w-full rounded-2xl border border-black/10 bg-white px-4 py-4 leading-7"
          value={form.description}
          onChange={e => setField("description", e.target.value)}
          placeholder="Clique em “Gerar descrição com SEO” depois de revisar os dados do veículo."
        />

        {seoPreview && (
          <div className="mt-5 rounded-2xl border border-black/10 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#8a7700]">Prévia para Google</p>
            <p className="mt-3 font-bold text-[#1a0dab]">{seoPreview.title}</p>
            <p className="mt-1 text-sm text-[#137333]">lwveiculos.com.br/veiculo/...</p>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{seoPreview.description}</p>
          </div>
        )}

        <p className="mt-3 text-xs leading-5 text-neutral-500">
          A descrição continua totalmente editável. Evite adicionar afirmações como “único dono”, “revisado” ou “impecável” sem confirmação.
        </p>
      </div>

      <div className="md:col-span-2">
        <label>
          <span className="text-sm font-bold">Fotos do veículo</span>
          <p className="mt-1 text-sm text-neutral-500">
            Selecione várias fotos de uma vez. Depois clique, segure e arraste cada foto para a posição desejada. A foto nº 1 será a capa do anúncio.
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            className="mt-3 block w-full rounded-2xl border border-black/10 p-3"
            onChange={e => setFiles(Array.from(e.target.files || []))}
          />
        </label>

        {initial && existingImages.length > 0 && (
          <div className="mt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Fotos já publicadas</p>
                <p className="mt-1 text-xs text-neutral-500">A ordem abaixo é a mesma ordem exibida no site. Arraste para reorganizar.</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {existingImages.map((photo,index) => (
                <div
                  key={photo.id}
                  draggable
                  onDragStart={() => setDraggingExistingIndex(index)}
                  onDragEnd={() => setDraggingExistingIndex(null)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleExistingDrop(index)}
                  className={`cursor-grab overflow-hidden rounded-2xl border bg-white transition ${
                    draggingExistingIndex === index
                      ? "scale-[.98] border-[#d6bd00] opacity-60"
                      : "border-black/10 hover:border-[#d6bd00]"
                  }`}
                  title="Clique, segure e arraste para mudar a posição"
                >
                  <div className="relative">
                    <img src={photo.url} alt={`Foto ${index+1}`} className="aspect-[4/3] w-full select-none object-cover pointer-events-none"/>
                    <span className="absolute right-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[11px] font-black text-white">
                      {index+1}
                    </span>
                    {index === 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-[#ffe331] px-2 py-1 text-[11px] font-black text-black">
                        CAPA
                      </span>
                    )}
                    <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-black">
                      ⠿ ARRASTE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {photoPreviews.length > 0 && (
          <div className="mt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{photoPreviews.length} nova(s) foto(s) selecionada(s)</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Clique, segure e arraste as fotos para reorganizar. A posição nº 1 será usada como capa.
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {photoPreviews.map((photo,index) => (
                <div
                  key={`${photo.name}-${index}`}
                  draggable
                  onDragStart={() => setDraggingFileIndex(index)}
                  onDragEnd={() => setDraggingFileIndex(null)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleFileDrop(index)}
                  className={`cursor-grab overflow-hidden rounded-2xl border bg-white transition ${
                    draggingFileIndex === index
                      ? "scale-[.98] border-[#d6bd00] opacity-60"
                      : "border-black/10 hover:border-[#d6bd00]"
                  }`}
                  title="Clique, segure e arraste para mudar a posição"
                >
                  <div className="relative">
                    <img src={photo.url} alt={photo.name} className="aspect-[4/3] w-full select-none object-cover pointer-events-none"/>
                    <span className="absolute right-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[11px] font-black text-white">
                      {existingImages.length + index + 1}
                    </span>
                    {!existingImages.length && index === 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-[#ffe331] px-2 py-1 text-[11px] font-black text-black">
                        CAPA
                      </span>
                    )}
                    <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-black">
                      ⠿ ARRASTE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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

      <div className="md:col-span-2 flex flex-wrap items-center gap-4 border-t border-black/10 pt-6">
        <button className="btn-dark rounded-2xl px-7 py-4 font-bold">Salvar e publicar veículo</button>
        <a href="/admin" className="btn-outline-dark rounded-2xl px-7 py-4 font-bold">Cancelar</a>
        {message && <span className="text-sm text-neutral-600">{message}</span>}
      </div>
    </form>
  );
}
