export default function Footer(){
  const wa=process.env.NEXT_PUBLIC_WHATSAPP||"5551996118804";
  return <footer className="bg-[#090909] text-white">
    <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:py-16">
      <div className="sm:col-span-2 lg:col-span-1">
        <img src="/logo-lw.png" alt="LW Veículos" className="h-11 w-auto object-contain"/>
        <p className="mt-4 max-w-xs text-sm leading-6 text-neutral-400">Compra, venda, troca e financiamento de veículos em Venâncio Aires - RS.</p>
      </div>
      <div><p className="text-xs font-black uppercase tracking-[.14em] text-[#ffe331]">Navegação</p>
        <div className="mt-4 grid gap-3 text-sm text-neutral-300"><a href="/">Início</a><a href="/estoque">Estoque</a><a href="/#sobre">Sobre</a><a href="/#contato">Contato</a></div>
      </div>
      <div><p className="text-xs font-black uppercase tracking-[.14em] text-[#ffe331]">Contato</p>
        <div className="mt-4 grid gap-3 text-sm text-neutral-300">
          <a target="_blank" rel="noreferrer" href={`https://wa.me/${wa}`}>(51) 99611-8804</a>
          <a target="_blank" rel="noreferrer" href="https://www.instagram.com/lw_veiculos/">@lw_veiculos</a>
        </div>
      </div>
      <div><p className="text-xs font-black uppercase tracking-[.14em] text-[#ffe331]">Endereço</p>
        <p className="mt-4 text-sm leading-6 text-neutral-300">Rua Dr. Armando Ruschel, 1701<br/>Gressler · Venâncio Aires/RS<br/>95800-000</p>
      </div>
    </div>
    <div className="border-t border-white/10">
      <div className="container flex flex-col gap-2 py-5 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} LW Veículos.</span><span>Todos os direitos reservados.</span>
      </div>
    </div>
  </footer>;
}
