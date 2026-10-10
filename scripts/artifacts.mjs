#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderArtifact,ensureArtifactEntries,ARTIFACTS,ARTIFACT_VERSION} from './lib/artifact-theme.mjs';

// Render evidence supplied by Codex. This command does not diagnose, authorize, execute or create a PR.
export async function generateArtifact(data,out){
 if(data?.schema!=='governui.artifact/1'||!['C','D'].includes(data.artifact))throw Error('Expected governui.artifact/1 with artifact C or D');
 for(const k of ['project','scope','baseline'])if(typeof data[k]!=='string'||!data[k])throw Error(`${k} is required`);
 if(data.artifact==='C'){
  if(!Array.isArray(data.groups))throw Error('groups are required');const ids=new Set();
  for(const g of data.groups){if(!g.id||ids.has(g.id)||!g.module||!g.title||!Array.isArray(g.occurrences)||!['needs-attention','applied','verified','excluded','blocked','queued'].includes(g.status))throw Error('Invalid audit group');ids.add(g.id)}
 }else{
  if(!['partial','complete'].includes(data.status)||typeof data.conclusion!=='string'||!data.metrics)throw Error('Outcome status, conclusion and metrics are required');
  for(const k of ['tokensChanged','filesChanged','linesAdded','linesRemoved'])if(!Number.isInteger(data.metrics[k])||data.metrics[k]<0)throw Error(`Invalid actual metric: ${k}`);
  for(const k of ['modules','captures','residuals','deliverables'])if(!Array.isArray(data[k]))throw Error(`${k} required`);
  for(const d of data.deliverables)if(!/^[a-zA-Z0-9_.\/-]+$/.test(d.file)||d.file.startsWith('/')||d.file.split('/').includes('..'))throw Error('Deliverable must be a local relative file');
  if(data.status==='complete'&&(data.residuals.length||data.captures.some(c=>!['verified','accepted'].includes(c.status)||!c.before||!c.after)))throw Error('Complete outcome conflicts with residual/unverified evidence');
 }
 await mkdir(out,{recursive:true});
 const file=path.join(out,ARTIFACTS.find(x=>x[0]===data.artifact)[1]);
 await writeFile(file,await renderArtifact(data.artifact,{...data,templateVersion:ARTIFACT_VERSION}));
 await ensureArtifactEntries(out);return {html:file};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),i=args.indexOf('--input'),o=args.indexOf('--out');
 if(i<0||o<0||!args[i+1]||!args[o+1])throw Error('Usage: node scripts/artifacts.mjs --input <artifact.json> --out <directory>');
 console.log(await generateArtifact(JSON.parse(await readFile(args[i+1],'utf8')),path.resolve(args[o+1])));
}
