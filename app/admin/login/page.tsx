"use client";

import {FormEvent,useEffect,useState} from "react";
import {supabase} from "@/lib/supabase";

const LOCK_AFTER=5;
const LOCK_MS=5*60*1000;

export default function Login(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [code,setCode]=useState("");
  const [factorId,setFactorId]=useState("");
  const [message,setMessage]=useState("");
  const [attempts,setAttempts]=useState(0);
  const [lockedUntil,setLockedUntil]=useState(0);

  useEffect(()=>{
    const raw=localStorage.getItem("lw-admin-login-guard");
    if(raw)try{const x=JSON.parse(raw);setAttempts(x.attempts||0);setLockedUntil(x.lockedUntil||0)}catch{}
    const params=new URLSearchParams(location.search);
    if(params.get("expired"))setMessage("Sessão encerrada por inatividade. Entre novamente.");
  },[]);

  function fail(){
    const next=attempts+1;
    const until=next>=LOCK_AFTER?Date.now()+LOCK_MS:0;
    setAttempts(next);setLockedUntil(until);
    localStorage.setItem("lw-admin-login-guard",JSON.stringify({attempts:next,lockedUntil:until}));
    setMessage(until?"Muitas tentativas. Aguarde 5 minutos antes de tentar novamente.":"Não foi possível entrar. Confira os dados.");
  }
  function clearGuard(){
    setAttempts(0);setLockedUntil(0);localStorage.removeItem("lw-admin-login-guard");
  }
  async function verifyAdmin(){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return false;
    const {data}=await supabase.from("admins").select("user_id").eq("user_id",user.id).maybeSingle();
    return !!data;
  }
  async function afterPassword(){
    if(!(await verifyAdmin())){await supabase.auth.signOut();fail();return}
    const {data:aal}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if(aal?.nextLevel==="aal2"&&aal.currentLevel!=="aal2"){
      const {data:factors}=await supabase.auth.mfa.listFactors();
      const verified=factors?.totp?.find((x:any)=>x.status==="verified");
      if(!verified){setMessage("Sua conta exige segundo fator, mas nenhum TOTP verificado foi encontrado.");return}
      setFactorId(verified.id);setMessage("Digite o código de 6 dígitos do seu aplicativo autenticador.");return;
    }
    clearGuard();location.replace("/admin");
  }
  async function login(ev:FormEvent){
    ev.preventDefault();
    if(lockedUntil>Date.now()){setMessage("Login temporariamente bloqueado neste navegador. Aguarde alguns minutos.");return}
    setMessage("Verificando acesso...");
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error){fail();return}
    await afterPassword();
  }
  async function verifyMfa(ev:FormEvent){
    ev.preventDefault();setMessage("Validando segundo fator...");
    const challenge=await supabase.auth.mfa.challenge({factorId});
    if(challenge.error){setMessage("Não foi possível iniciar a verificação em duas etapas.");return}
    const verified=await supabase.auth.mfa.verify({factorId,challengeId:challenge.data.id,code});
    if(verified.error){setMessage("Código inválido ou expirado.");return}
    if(!(await verifyAdmin())){await supabase.auth.signOut();setMessage("Acesso não autorizado.");return}
    clearGuard();location.replace("/admin");
  }

  if(factorId)return <main className="flex min-h-screen items-center justify-center bg-black p-4">
    <form onSubmit={verifyMfa} className="w-full max-w-md rounded-2xl bg-white p-8">
      <p className="text-xs font-black uppercase tracking-[.14em] text-[#8a7700]">Segurança</p>
      <h1 className="mt-2 text-3xl font-black">Verificação em duas etapas</h1>
      <p className="mt-3 text-sm leading-6 text-neutral-500">Abra seu aplicativo autenticador e informe o código atual.</p>
      <input className="mt-7 w-full rounded-xl border px-4 py-4 text-center text-2xl font-black tracking-[.3em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))} required/>
      <button className="btn-dark mt-5 w-full rounded-xl px-5 py-4 font-bold">Confirmar código</button>
      {message&&<p className="mt-4 text-sm text-neutral-600">{message}</p>}
    </form>
  </main>;

  return <main className="flex min-h-screen items-center justify-center bg-black p-4">
    <form onSubmit={login} className="w-full max-w-md rounded-2xl bg-white p-8">
      <h1 className="text-3xl font-black">Painel LW Veículos</h1>
      <p className="mt-2 text-sm text-neutral-500">Área restrita à administração.</p>
      <input className="mt-8 w-full rounded-xl border px-4 py-3" type="email" autoComplete="username" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <input className="mt-4 w-full rounded-xl border px-4 py-3" type="password" autoComplete="current-password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} required/>
      <button disabled={lockedUntil>Date.now()} className="btn-dark mt-6 w-full rounded-xl px-5 py-4 font-bold disabled:opacity-50">Entrar</button>
      {message&&<p className="mt-4 text-sm text-neutral-600">{message}</p>}
    </form>
  </main>;
}
