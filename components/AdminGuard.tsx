"use client";

import {useEffect,useRef,useState} from "react";
import {supabase} from "@/lib/supabase";

const IDLE_LIMIT_MS=30*60*1000;

export default function AdminGuard({children}:{children:React.ReactNode}){
  const [allowed,setAllowed]=useState<boolean|null>(null);
  const lastActivity=useRef(Date.now());

  useEffect(()=>{
    let active=true;
    const check=async()=>{
      const {data:{session}}=await supabase.auth.getSession();
      const user=session?.user;
      if(!user){location.replace("/admin/login");return}

      const {data:admin}=await supabase.from("admins").select("user_id").eq("user_id",user.id).maybeSingle();
      if(!admin){await supabase.auth.signOut();location.replace("/admin/login");return}

      const {data:aal}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if(aal?.nextLevel==="aal2"&&aal.currentLevel!=="aal2"){
        location.replace("/admin/login?mfa=1");return;
      }
      if(active)setAllowed(true);
    };
    check();

    const activity=()=>{lastActivity.current=Date.now()};
    ["pointerdown","keydown","scroll","touchstart"].forEach(evt=>window.addEventListener(evt,activity,{passive:true}));
    const timer=window.setInterval(async()=>{
      if(Date.now()-lastActivity.current>IDLE_LIMIT_MS){
        await supabase.auth.signOut();
        location.replace("/admin/login?expired=1");
      }
    },60_000);

    return()=>{
      active=false;
      ["pointerdown","keydown","scroll","touchstart"].forEach(evt=>window.removeEventListener(evt,activity));
      window.clearInterval(timer);
    };
  },[]);

  if(allowed===null)return <div className="container py-20">Verificando acesso seguro...</div>;
  return <>{children}</>;
}
