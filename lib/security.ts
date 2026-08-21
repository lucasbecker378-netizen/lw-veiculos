export const MAX_VEHICLE_PHOTOS=30;
export const MAX_IMAGE_BYTES=8*1024*1024;
export const ALLOWED_IMAGE_TYPES=new Set(["image/jpeg","image/png","image/webp"]);

export function validateVehicleImage(file:File){
  if(!ALLOWED_IMAGE_TYPES.has(file.type)){
    return "Formato não permitido. Use JPG, PNG ou WebP.";
  }
  if(file.size>MAX_IMAGE_BYTES){
    return "A imagem ultrapassa o limite de 8 MB.";
  }
  return null;
}

export function safeImageExtension(file:File){
  if(file.type==="image/png")return "png";
  if(file.type==="image/webp")return "webp";
  return "jpg";
}
