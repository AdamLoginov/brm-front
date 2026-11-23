// --------- новый код chat: проверки активности без браузера и реальных запросов
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('./sessionActivity.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replaceAll('export const ', 'const ')
    .replace("import.meta.env.VITE_API_BASE_URL", "''");
const token = expires => 'header.' + Buffer.from(JSON.stringify({exp:expires})).toString('base64url') + '.signature';
function setup() {
    let now = 1800000000000, requests = 0, answer;
    const values = new Map([['user-token', token(now / 1000 + 3600)], ['user-id', '1']]);
    const events = new Map(), timers = new Map(), routes = [];
    let timerID = 0;
    const document = {hidden:false, addEventListener:(name,fn)=>events.set(name,fn), removeEventListener:name=>events.delete(name)};
    const window = {addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name),setTimeout:fn=>{timers.set(++timerID,fn);return timerID;},clearTimeout:id=>timers.delete(id)};
    const post = async path => {
        if (path === '/files/logout') return {};
        requests++;
        return answer ? answer() : {data:{token:token(now / 1000 + 259200)}};
    };
    const context = vm.createContext({document,window,localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},Date:{now:()=>now},atob:value=>Buffer.from(value,'base64').toString(),axios:{create:()=>({post})},router:{currentRoute:{value:{path:'/'}},replace:path=>{routes.push(path);return Promise.resolve();}},console});
    vm.runInContext(source + '; globalThis.api = {startSessionActivity, stopSessionActivity, renewSessionOnActivity, scheduleExpiry};',context);
    return {api:context.api,document,values,events,routes,timers,setNow:value=>now=value,getNow:()=>now,requests:()=>requests,setAnswer:fn=>answer=fn};
}
const flush = () => new Promise(resolve=>setImmediate(resolve));

test('opening renews; idle timer and hidden activity do not renew',async()=>{
    const s=setup(); s.api.startSessionActivity(); await flush();
    assert.equal(s.requests(),1);
    s.setNow(s.getNow()+60000);
    s.api.scheduleExpiry(); await flush(); assert.equal(s.requests(),1);
    s.document.hidden=true; await s.api.renewSessionOnActivity(); assert.equal(s.requests(),1);
    s.document.hidden=false; s.events.get('keydown')({isTrusted:true}); await flush();
    assert.equal(s.requests(),2);
    s.api.stopSessionActivity(); assert.equal(s.events.size,0);
});
test('expiry signs out and never refreshes an expired token',async()=>{
    const s=setup(); s.api.startSessionActivity(); await flush();
    s.setNow(s.getNow()+259201000);
    await s.api.renewSessionOnActivity();
    assert.equal(s.values.has('user-token'),false); assert.deepEqual(s.routes,['/login']); assert.equal(s.requests(),1);
});
test('late refresh cannot restore logout or overwrite another login',async()=>{
    for(const replacement of [null,token(1900000000)]) {
        const s=setup(); let resolve;
        s.setAnswer(()=>new Promise(done=>resolve=done));
        s.api.startSessionActivity();
        if(replacement) s.values.set('user-token',replacement); else s.values.delete('user-token');
        resolve({data:{token:token(1950000000)}}); await flush();
        assert.equal(s.values.get('user-token')||null,replacement);
    }
});
// --------- конец нового кода chat
