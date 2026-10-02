export const MAX_FILE_SIZE=1024*1024*1024;
export const PART_SIZE=8*1024*1024;
export const MAX_FILES=60;
export const MIME_TYPES=['image/jpeg','image/png','image/webp','video/mp4','video/webm','application/pdf'];
export function matchesFileType(bytes:Uint8Array,mime:string){const magic=String.fromCharCode(...bytes.slice(0,12));return mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216:mime==='image/png'?bytes[0]===137&&magic.slice(1,4)==='PNG':mime==='image/webp'?magic.startsWith('RIFF')&&magic.slice(8)==='WEBP':mime==='application/pdf'?magic.startsWith('%PDF-'):mime==='video/mp4'?magic.slice(4,8)==='ftyp':mime==='video/webm'&&bytes[0]===26&&bytes[1]===69&&bytes[2]===223&&bytes[3]===163;}
