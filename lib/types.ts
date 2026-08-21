export type VehicleStatus="draft"|"available"|"sold";

export type Vehicle={
  id:string;
  vehicle_code:string|null;
  slug:string;
  brand:string;
  model:string;
  version:string|null;
  year:number;
  model_year:number|null;
  mileage:number;
  price:number;
  transmission:string;
  fuel:string;
  color:string|null;
  description:string|null;
  internal_notes:string|null;
  optional_items:string[]|null;
  status:VehicleStatus;
  featured:boolean;
  featured_order:number;
  created_at:string;
  updated_at:string;
};

export type VehicleImage={
  id:string;
  vehicle_id:string;
  url:string;
  sort_order:number;
  created_at:string;
};
