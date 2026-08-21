import {supabase} from "@/lib/supabase";

export async function audit(action:string,vehicleId?:string|null,details:Record<string,unknown>={}){
  try{
    await supabase.from("admin_audit_log").insert({
      action,
      vehicle_id:vehicleId||null,
      details,
    });
  }catch{
    // Auditoria não deve interromper a operação principal.
  }
}
