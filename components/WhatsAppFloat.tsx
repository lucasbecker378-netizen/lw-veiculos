"use client";

export default function WhatsAppFloat(){
  const wa=process.env.NEXT_PUBLIC_WHATSAPP||"5551996118804";
  const msg=encodeURIComponent("Olá! Vim pelo site da LW Veículos e gostaria de falar com a equipe.");
  return <a
    href={`https://wa.me/${wa}?text=${msg}`}
    target="_blank" rel="noreferrer"
    aria-label="Falar com a LW Veículos no WhatsApp"
    className="fixed bottom-5 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-[#25D366] px-4 font-black text-white shadow-[0_12px_30px_rgba(0,0,0,.22)] transition hover:-translate-y-1 sm:bottom-6 sm:right-6"
  >
    <span className="text-xl">◉</span><span className="hidden sm:inline">WhatsApp</span>
  </a>;
}
