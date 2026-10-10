import {test} from 'node:test';
import assert from 'node:assert/strict';
import {radixPreview,iconUsage} from '../lib/icon-evidence.mjs';
test('Radix literal geometry is extracted without executing code',()=>{
 const source='var ArrowDownIcon = forwardRef(function(){return createElement("svg", {viewBox: "0 0 15 15"}, createElement("path", {d: "M1 2L3 4",fill: color,fillRule: "evenodd"}));\n});';
 const svg=Buffer.from(radixPreview(source,'ArrowDownIcon').split(',')[1],'base64').toString();
 assert.match(svg,/M1 2L3 4/);assert.match(svg,/fill-rule="evenodd"/);assert.equal(radixPreview(source,'Missing'),null);
});
test('real repository package and consumer acceptance (explicit environment)',async t=>{
 if(!process.env.GOVERN_UI_TEST_REPO)return t.skip('requires explicit real repository');
 const usage=await iconUsage(process.env.GOVERN_UI_TEST_REPO,{file:'src/components/data-table/column-header.tsx'},{local:'ArrowDownIcon'});
 assert.deepEqual(usage.sizes.sort(),['0.875rem','1rem']);assert.equal(usage.sizeEvidence.length,2);
});
