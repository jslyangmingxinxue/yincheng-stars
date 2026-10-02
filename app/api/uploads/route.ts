import {mustMember,checkOrigin} from '../../../lib/classroom';
import {beginUpload,uploadError} from '../../../lib/multipart';
export const dynamic='force-dynamic';
export async function POST(req:Request){try{checkOrigin(req);const m=await mustMember();return Response.json(await beginUpload(await req.json(),m),{headers:{'Cache-Control':'no-store'}})}catch(e){return uploadError(e)}}
