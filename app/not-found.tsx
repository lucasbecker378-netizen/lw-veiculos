import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound(){
  return <><Header/><main className="container flex min-h-[62vh] items-center py-16">
    <div className="max-w-xl">
      <p className="text-xs font-black uppercase tracking-[.18em] text-[#9a8400]">Erro 404</p>
      <h1 className="mt-3 text-5xl font-black tracking-tight">Esta página não foi encontrada.</h1>
      <p className="mt-5 leading-7 text-neutral-600">O endereço pode ter mudado ou o veículo pode não estar mais disponível.</p>
      <div className="mt-7 flex flex-wrap gap-3"><a href="/estoque" className="btn-dark rounded-xl px-6 py-4 font-black">Ver estoque</a><a href="/" className="btn-outline-dark rounded-xl px-6 py-4 font-bold">Ir para a Home</a></div>
    </div>
  </main><Footer/></>;
}
