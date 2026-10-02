import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
const origin='http://127.0.0.1:5173',admin='__sites_local_auth=1',parent='__sites_local_auth=1; yc_preview_role=parent';
const chunkSize=8*1024*1024,limit=1024*1024*1024;
async function send(path,method,body,expected=200,cookie=admin,type='application/json'){const r=await fetch(origin+path,{method,headers:{cookie,origin,'Content-Type':type},body:type==='application/json'?JSON.stringify(body):body});const d=await r.json();assert.equal(r.status,expected,JSON.stringify(d));return d;}
const calls=[];const pass=s=>{calls.push(s);console.log('PASS '+s)};
let backup,active=[];try{backup=await send('/api/classroom','POST',{action:'backup'});const post=await send('/api/classroom','POST',{action:'save',kind:'album',title:'大文件验证',body:'测试后恢复',term:'2026-autumn',children:['s2'],visibility:'private'});
 const totalSize=64*1024*1024+123;const input={post:post.id,name:'分片验证.mp4',mime:'video/mp4',size:totalSize,fingerprint:'a'.repeat(64)};
 const session=await send('/api/uploads','POST',input);active.push(session.id);assert.equal(session.partSize,chunkSize);
 await send('/api/uploads','POST',{...input,size:limit+1,fingerprint:'b'.repeat(64)},400);const boundary=await send('/api/uploads','POST',{...input,size:limit,fingerprint:'c'.repeat(64)});active.push(boundary.id);await send('/api/uploads/'+boundary.id,'DELETE',{});active=active.filter(x=>x!==boundary.id);pass('1GB边界允许，超过1GB拒绝');
 await send('/api/uploads/'+session.id+'?part=1','PUT',Buffer.alloc(chunkSize),400,admin,'application/octet-stream');pass('伪造视频类型被拒绝');
 const first=Buffer.alloc(chunkSize,3);first.writeUInt32BE(24,0);first.write('ftypisom',4,'ascii');first.writeUInt32BE(0,12);first.write('isommp42',16,'ascii');
 await send('/api/uploads/'+session.id+'?part=1','PUT',Buffer.alloc(1),403,parent,'application/octet-stream');
 await send('/api/uploads/'+session.id+'?part=1','PUT',Buffer.alloc(chunkSize+1),413,admin,'application/octet-stream');
 await send('/api/uploads/'+session.id+'?part=1','PUT',first,200,admin,'application/octet-stream');
 const resumed=await send('/api/uploads','POST',input);assert.equal(resumed.id,session.id);assert.deepEqual(resumed.parts,[{number:1,size:chunkSize}]);await send('/api/uploads/'+session.id,'POST',{},409);
 await send('/api/classroom','POST',{action:'save',id:post.id,revision:post.revision,kind:'album',title:'大文件验证',term:'2026-autumn',children:['s2'],visibility:'private',submit:true},400);pass('进度持久保存、断点续传、上传中禁止发布');
 const digest=createHash('sha256');digest.update(first);const parts=Math.ceil(totalSize/chunkSize);for(let n=2;n<=parts;n++){const part=Buffer.alloc(Math.min(chunkSize,totalSize-(n-1)*chunkSize),n);digest.update(part);await send('/api/uploads/'+session.id+'?part='+n,'PUT',part,200,admin,'application/octet-stream');if(n===2)await send('/api/uploads/'+session.id+'?part='+n,'PUT',part,200,admin,'application/octet-stream');}
 const finished=await send('/api/uploads/'+session.id,'POST',{});active=active.filter(x=>x!==session.id);assert.equal(finished.id,session.id);assert.equal((await send('/api/uploads/'+session.id,'POST',{})).id,session.id);assert.equal((await send('/api/uploads','POST',input)).status,'complete');
 const file=await fetch(origin+'/api/files/'+finished.id,{headers:{cookie:admin}});assert.equal(file.status,200);if(file.headers.has('content-length'))assert.equal(Number(file.headers.get('content-length')),totalSize);const actual=createHash('sha256');let received=0;for await(const data of file.body){received+=data.length;actual.update(data);}assert.equal(received,totalSize);assert.equal(actual.digest('hex'),digest.digest('hex'));const partial=await fetch(origin+'/api/files/'+finished.id,{headers:{cookie:admin,range:'bytes=4-11'}});assert.equal(partial.status,206);assert.equal(await partial.text(),'ftypisom');assert.equal((await fetch(origin+'/api/files/'+finished.id,{headers:{cookie:parent}})).status,403);pass('64MB以上文件分片合并、字节完整性、重复提交及私密访问通过');
 await mkdir('outputs',{recursive:true});await writeFile('outputs/multipart-verification.json',JSON.stringify({testedBytes:totalSize,limitBytes:limit,chunkBytes:chunkSize,passed:calls,note:'已实传64MB以上测试文件，并验证1GB声明边界；未实传完整1GB视频。'},null,2));
}finally{for(const sid of active)await send('/api/uploads/'+sid,'DELETE',{});if(backup)await send('/api/classroom','POST',{action:'restoreBackup',key:backup.key});}
