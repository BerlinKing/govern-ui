import {test} from 'node:test';
import assert from 'node:assert/strict';
import {iconCatalog} from '../lib/icon-catalog.mjs';
test('real icons only; source identity, all sizes, unresolved is explicit',()=>{
 assert.deepEqual(iconCatalog(),[]);
 const a={id:'a',name:'Close',importedName:'Close',source:'one',sizes:['16px']};
 const rows=iconCatalog([a,{...a,sizes:['20px']},{...a,id:'b',source:'two'},{...a,id:'logo',kind:'brand-mark'}]);
 assert.equal(rows.length,2);assert.deepEqual(rows[0].sizes,['16px','20px']);assert.equal(rows[0].preview,null);
 assert.throws(()=>iconCatalog([{...a,sizes:['24']}]),/sizes/);
 assert.equal(iconCatalog([{...a,preview:'javascript:bad'}])[0].preview,null);
});
