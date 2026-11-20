// --------- новый код chat: точность и отображение количеств
import test from 'node:test';import assert from 'node:assert/strict';import {quantityText,scaledQuantity} from './workOrderHelpers.js';
test('Fixed point quantities preserve hundredths and thousandths',()=>{
    for(const [text,digits,value] of [['0,125',3,125],['1.25',3,1250],['12.5',2,1250],['10',3,10000],['0',2,0]]){assert.equal(scaledQuantity(text,digits),value);assert.equal(scaledQuantity(quantityText(value,digits),digits),value);}
    for(const text of ['','-1','NaN','1e3','1.2345','1.'])assert.equal(scaledQuantity(text,3),null);
});
// --------- конец нового кода chat
