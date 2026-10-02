import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { getChatGPTUser } from '../app/chatgpt-auth';
export type Member={id:string;email:string;name:string;role:string;students:string};
export type Post={id:string;owner:string;kind:string;title:string;body:string;term:string;children:string;visibility:string;public:number;status:string;featured:number;pinned:number;cover:string|null;rejection:string;parent:string|null;revision:number;created:string;updated:string;deleted:string|null};
export const now=()=>new Date().toISOString();
export const id=()=>crypto.randomUUID();
export const parse=(s:string|null)=>{try{return JSON.parse(s||'[]') as string[]}catch{return []}};
export function database():D1Database { const db=(env as unknown as {DB:D1Database}).DB;if(!db)throw new Error('数据服务暂时不可用，请稍后重试');return db;}
export function bucket():R2Bucket {const b=(env as unknown as {BUCKET:R2Bucket}).BUCKET;if(!b)throw new Error('文件存储暂时不可用');return b;}
export async function all<T=Record<string,unknown>>(sql:string,...args:unknown[]):Promise<T[]>{return (await database().prepare(sql).bind(...args).all<T>()).results;}
export async function one<T=Record<string,unknown>>(sql:string,...args:unknown[]):Promise<T|null>{return database().prepare(sql).bind(...args).first<T>();}
export async function run(sql:string,...args:unknown[]){return database().prepare(sql).bind(...args).run();}
export function teacher(m:Member|null){return !!m&&['admin','teacher'].includes(m.role)}
export async function member():Promise<Member|null>{const u=await getChatGPTUser();if(!u)return null;
 if(import.meta.env.DEV&&u.userId==='local_seedy'){const selected=(await cookies()).get('yc_preview_role')?.value;const parent=selected==='parent'||selected==='other-parent';return {id:parent?(selected==='other-parent'?'demo-other-parent':'demo-parent'):u.userId,email:u.email,name:parent?(selected==='other-parent'?'星小川家长（预览）':'星小禾家长（预览）'):'班主任（预览）',role:parent?'parent':'admin',students:parent?(selected==='other-parent'?'["s2"]':'["s1"]'):'[]'};}
 return one<Member>('SELECT * FROM members WHERE id=?',u.userId);}
export function visible(p:Post,m:Member|null){if(p.deleted)return false;if(teacher(m)||m?.id===p.owner)return true;if(p.status!=='published')return false;if(p.public)return true;if(!m)return false;if(p.visibility==='shared')return true;return parse(p.children).some(s=>parse(m.students).includes(s));}
export async function mustMember(){const m=await member();if(!m)throw new AccessError('请先登录并接受班级邀请',401);return m;}
export class AccessError extends Error{constructor(message:string,public status=400){super(message)}}
export function checkOrigin(req:Request){const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)throw new AccessError('请求来源不正确，请刷新后重试',403);}
export async function log(m:Member,action:string,target:string){await run('INSERT INTO audit(id,actor,action,target,created) VALUES(?,?,?,?,?)',id(),m.name,action,target,now());}
export const defaultSettings={name:'银城状元星',className:'三年级2班',motto:'让每个孩子，闪闪发光。',intro:'在三年级2班，我们一起读书、探索、创造，把每一次小小的进步，写进共同的成长册。',modules:['album','work','article'],carousel:true,contact:'请通过班级既有联系渠道联系班主任。'};
export const defaultTerm={id:'2026-autumn',name:'2026—2027学年 · 第一学期',grade:'三年级',active:1,archived:0};
export function examples():Post[]{const base={owner:'example',term:defaultTerm.id,children:'["s1"]',visibility:'shared',status:'published',featured:1,pinned:0,cover:null,rejection:'',parent:null,revision:1,created:'2026-09-28T00:00:00.000Z',updated:'2026-09-28T00:00:00.000Z',deleted:null};return [
 {...base,id:'example-reading',kind:'album',title:'把秋天读成一首诗',body:'示例活动：我们带着喜欢的书来到校园，在树荫下分享故事，也分享读书时的奇思妙想。\n\n此处使用校园插画，真实班级照片将在老师上传后展示。',public:1,cover:'/campus.png'},
 {...base,id:'example-garden',kind:'album',title:'小小种植家，收获大快乐',body:'示例活动：种下一颗种子，观察叶子的变化，学习耐心等待。',public:0,cover:'/campus.png'},
 {...base,id:'example-flight',kind:'album',title:'纸飞机带着梦想出发',body:'示例活动：折一架纸飞机，猜一猜怎样才能飞得更远。',public:0,cover:'/campus.png'},
 {...base,id:'example-work',kind:'work',title:'窗外的那棵树',body:'示例作文 · 作者：星小禾（虚构）\n\n教室窗外有一棵树。早晨，阳光落在叶子上，好像给它们戴上了金色的小帽子。\n\n下课的时候，我常常抬头看它。风一吹，树叶轻轻摇动，像在和我们打招呼。\n\n我想，它一定记得我们读书的声音，也记得我们一起长大的模样。',public:1},
 {...base,id:'example-art',kind:'work',title:'我的星光小花园',body:'示例绘画作品：用喜欢的颜色，画出心里的小花园。',public:0},
 {...base,id:'example-private',kind:'work',title:'我的阅读成长记录',body:'示例私密作品：本周我坚持读书五天，最喜欢的故事是关于勇气的故事。',public:0,visibility:'private'},
 {...base,id:'example-article',kind:'article',title:'每天十分钟，陪孩子读一本书',body:'示例学习文章\n\n选择孩子感兴趣的书，在固定时间一起阅读。读完可以聊一聊最喜欢的人物，也可以让孩子画出印象最深的一幕。\n\n阅读的起点，是好奇与陪伴。',public:1},
 {...base,id:'example-notice',kind:'notice',title:'一起开启新学期的成长旅程',body:'示例公告：欢迎来到三年级2班的成长空间。活动照片、作品和班级通知将在这里陆续更新。',public:0,pinned:1}
 ]}
export async function snapshot(m:Member){if(m.role!=='admin')throw new AccessError('仅管理员可备份',403);const tables=['members','students','terms','posts','files','comments','invites','settings','audit','versions'];const data:Record<string,unknown>={format:'yincheng-stars-v1',created:now()};for(const t of tables)data[t]=await all('SELECT * FROM '+t);const key='backups/'+now().replaceAll(':','-')+'.json';await bucket().put(key,JSON.stringify(data),{httpMetadata:{contentType:'application/json'}});await run('INSERT INTO settings(id,value) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value','lastBackup',JSON.stringify({key,date:now()}));return {key,date:now()};}
