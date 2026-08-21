"use client";

import {FormEvent,useEffect,useState} from "react";
import AdminGuard from "@/components/AdminGuard";
import {supabase} from "@/lib/supabase";

export default function Security(){
  const [factors,setFactors]=useState<any[]>([]);
  const [qr,setQr]=useState("");
  const [secret,setSecret]=useState("");
  const [factorId,setFactorId]=useState("");
  const [code,setCode]=useState("");
  const [message,setMessage]=useState("");

  async function load(){
    const {data}=await supabase.auth.mfa.listFactors();
    setFactors(data?.totp||[]);
  }
  useEffect(()=>{load()},[]);

  async function enroll(){
    setMessage("Gerando configuração...");
    const {data,error}=await supabase.auth.mfa.enroll({factorType:"totp",friendlyName:"LW Veículos Admin"});
    if(error){setMessage(error.message);return}
    setFactorId(data.id);setQr(data.totp.qr_code);setSecret(data.totp.secret);
    setMessage("Escaneie o QR Code e confirme com o código de 6 dígitos.");
  }
  async function confirmEnroll(ev:FormEvent){
    ev.preventDefault();
    const c=await supabase.auth.mfa.challenge({factorId});
    if(c.error){setMessage(c.error.message);return}
    const v=await supabase.auth.mfa.verify({factorId,challengeId:c.data.id,code});
    if(v.error){setMessage("Código inválido. Tente novamente.");return}
    setQr("");setSecret("");setFactorId("");setCode("");setMessage("2FA ativado com sucesso.");load();
  }
  async function remove(id:string){
    if(!window.confirm("Remover este segundo fator?"))return;
    const {error}=await supabase.auth.mfa.unenroll({factorId:id});
    setMessage(error?error.message:"Segundo fator removido.");load();
  }

  return <AdminGuard><main className="container max-w-3xl py-10">
    <a href="/admin" className="text-sm font-bold">← Voltar ao painel</a>
    <h1 className="mt-5 text-4xl font-black">Segurança da conta</h1>
    <p className="mt-3 leading-7 text-neutral-600">Ative autenticação em duas etapas com Google Authenticator, Microsoft Authenticator, Authy, 1Password ou outro app TOTP.</p>

    <section className="mt-8 rounded-[24px] border border-black/10 bg-white p-6">
      <h2 className="text-xl font-black">Autenticação em duas etapas</h2>
      {factors.filter(x=>x.status==="verified").length>0
        ?<div className="mt-5"><p className="font-bold text-emerald-700">✓ 2FA ativo</p>
          {factors.filter(x=>x.status==="verified").map(x=><div key={x.id} className="mt-3 flex items-center justify-between rounded-xl bg-neutral-50 p-4"><span>{x.friendly_name||"Aplicativo autenticador"}</span><button onClick={()=>remove(x.id)} className="text-sm font-bold text-red-600">Remover</button></div>)}
        </div>
        :<button onClick={enroll} className="btn-dark mt-5 rounded-xl px-5 py-3 font-bold">Ativar 2FA</button>}
      {qr&&<form onSubmit={confirmEnroll} className="mt-6 rounded-2xl bg-neutral-50 p-5">
        <img src={qr} alt="QR Code para configurar 2FA" className="h-52 w-52 bg-white p-2"/>
        <p className="mt-4 text-xs text-neutral-500">Se não conseguir escanear: <code className="break-all font-bold text-black">{secret}</code></p>
        <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))} maxLength={6} inputMode="numeric" className="mt-4 w-full rounded-xl border px-4 py-3" placeholder="Código de 6 dígitos" required/>
        <button className="btn-yellow mt-3 rounded-xl px-5 py-3 font-black">Confirmar e ativar</button>
      </form>}
      {message&&<p className="mt-4 text-sm text-neutral-600">{message}</p>}
    </section>
  </main></AdminGuard>;
}
