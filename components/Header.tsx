"use client";

import {useEffect,useState} from "react";

export default function Header(){
  const [open,setOpen]=useState(false);
  const wa=process.env.NEXT_PUBLIC_WHATSAPP||"5551996118804";

  useEffect(()=>{
    document.body.style.overflow=open?"hidden":"";
    return()=>{document.body.style.overflow=""};
  },[open]);

  const close=()=>setOpen(false);

  return <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090909]/96 text-white backdrop-blur-xl">
    <div className="container flex h-[68px] items-center justify-between gap-4 sm:h-20">
      <a href="/" onClick={close} className="flex items-center">
        <img src="/logo-lw.png" alt="LW Veículos" className="h-9 w-auto max-w-[145px] object-contain sm:h-12 sm:max-w-[190px]"/>
      </a>

      <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
        <a className="transition hover:text-[#ffe331]" href="/">Início</a>
        <a className="transition hover:text-[#ffe331]" href="/estoque">Estoque</a>
        <a className="transition hover:text-[#ffe331]" href="/#sobre">Sobre</a>
        <a className="transition hover:text-[#ffe331]" href="/#contato">Contato</a>
      </nav>

      <div className="flex items-center gap-2">
        <a target="_blank" rel="noreferrer" href={`https://wa.me/${wa}`} className="btn-yellow hidden rounded-full px-5 py-3 text-sm font-black sm:block">
          WhatsApp
        </a>
        <button
          type="button"
          onClick={()=>setOpen(!open)}
          aria-label={open?"Fechar menu":"Abrir menu"}
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 md:hidden"
        >
          <span className="relative block h-4 w-5">
            <span className={`absolute left-0 top-0 h-[2px] w-5 bg-white transition ${open?"translate-y-[7px] rotate-45":""}`}/>
            <span className={`absolute left-0 top-[7px] h-[2px] w-5 bg-white transition ${open?"opacity-0":""}`}/>
            <span className={`absolute left-0 top-[14px] h-[2px] w-5 bg-white transition ${open?"-translate-y-[7px] -rotate-45":""}`}/>
          </span>
        </button>
      </div>
    </div>

    {open&&<div className="fixed inset-x-0 top-[68px] z-50 h-[calc(100dvh-68px)] bg-[#090909] md:hidden">
      <div className="container flex h-full flex-col py-8">
        <nav className="grid">
          {[["Início","/"],["Estoque","/estoque"],["Sobre nós","/#sobre"],["Contato","/#contato"]].map(([label,href])=>
            <a key={label} onClick={close} href={href} className="border-b border-white/10 py-5 text-2xl font-black">{label}</a>)}
        </nav>
        <div className="mt-auto pb-6">
          <a target="_blank" rel="noreferrer" href={`https://wa.me/${wa}`} className="btn-yellow block rounded-2xl px-5 py-4 text-center font-black">
            Falar no WhatsApp
          </a>
          <p className="mt-4 text-center text-xs text-neutral-500">LW Veículos · Venâncio Aires/RS</p>
        </div>
      </div>
    </div>}
  </header>;
}
