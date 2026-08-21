export default function VehicleSkeleton(){
  return <div className="overflow-hidden rounded-[22px] border border-black/5 bg-white">
    <div className="aspect-[16/10] animate-pulse bg-neutral-200 sm:aspect-[4/3]"/>
    <div className="p-4 sm:p-5">
      <div className="h-3 w-32 animate-pulse rounded bg-neutral-200"/>
      <div className="mt-3 h-6 w-3/4 animate-pulse rounded bg-neutral-200"/>
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-neutral-100"/>
      <div className="mt-5 h-7 w-40 animate-pulse rounded bg-neutral-200"/>
      <div className="mt-5 h-12 animate-pulse rounded-xl bg-neutral-200"/>
    </div>
  </div>;
}
