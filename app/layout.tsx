import type {Metadata} from "next";
import "./globals.css";

const siteUrl=process.env.NEXT_PUBLIC_SITE_URL || "https://lw-veiculos.vercel.app";

export const metadata:Metadata={
  metadataBase:new URL(siteUrl),
  title:{
    default:"LW Veículos | Seminovos em Venâncio Aires",
    template:"%s | LW Veículos",
  },
  description:"Veículos seminovos em Venâncio Aires - RS. Confira o estoque da LW Veículos e fale diretamente com nossa equipe.",
  keywords:["LW Veículos","carros Venâncio Aires","seminovos Venâncio Aires","veículos usados RS","revenda de carros Venâncio Aires"],
  openGraph:{
    type:"website",
    locale:"pt_BR",
    siteName:"LW Veículos",
    title:"LW Veículos | Seminovos em Venâncio Aires",
    description:"Confira veículos disponíveis, fotos, preços e condições na LW Veículos.",
    images:[{url:"/estoque-lw.jpeg",width:1200,height:630,alt:"LW Veículos"}],
  },
  twitter:{
    card:"summary_large_image",
    title:"LW Veículos",
    description:"Seminovos em Venâncio Aires - RS.",
    images:["/estoque-lw.jpeg"],
  },
  alternates:{canonical:"/"},
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="pt-BR"><body>{children}</body></html>;
}
