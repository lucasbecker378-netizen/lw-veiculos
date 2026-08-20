export const money=(v:number)=>new Intl.NumberFormat("pt-BR",{
  style:"currency",
  currency:"BRL",
  minimumFractionDigits:2,
  maximumFractionDigits:2
}).format(Number(v)||0);
