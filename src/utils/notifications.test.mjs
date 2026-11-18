// --------- новый код chat: очередь всех страниц и изоляция пользователей
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('./notifications.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace(/export /g, '');
const flush = () => new Promise(resolve => setImmediate(resolve));
function setup(api) {
    const storage = new Map([['user-token','token-a'],['user-id','1']]);
    const context = {reactive:value=>value, api, localStorage:{getItem:key=>storage.get(key)},
        document:{hidden:false,addEventListener(){},removeEventListener(){}},
        window:{setInterval(){},clearInterval(){},addEventListener(){},removeEventListener(){}}};
    const store = vm.runInNewContext(source + '; ({notificationsState,refreshNotifications,readNotifications,locateNotification});',context);
    return {store,storage};
}
test('toast queue covers all pages without changing the open page; reads remove toast', async () => {
    const read = new Set();
    const records = Array.from({length:53},(_,index)=>({ID:53-index,read_at:null}));
    const api = {
        async get(url,{params:{page}}) { return {data:{items:records.slice((page-1)*50,page*50).map(item=>({...item,read_at:read.has(item.ID)?'now':null})),total:53,unread:53-read.size,page,page_size:50}}; },
        async post(url) { if(url.endsWith('read-all')) records.forEach(item=>read.add(item.ID)); else read.add(Number(url.split('/')[2])); }
    };
    const {store} = setup(api);
    await store.refreshNotifications(1);
    await flush();
    await store.refreshNotifications(2);
    await flush();
    assert.equal(store.notificationsState.page,2);
    assert.equal(store.notificationsState.toastItems.length,53);
    assert.equal(store.notificationsState.toastItems[0].ID,53);
    assert.equal(await store.locateNotification(1),2);
    await store.readNotifications(53);
    await flush();
    assert.equal(store.notificationsState.toastItems.some(item=>item.ID===53),false);
    await store.readNotifications();
    await flush();
    assert.equal(store.notificationsState.toastItems.length,0);
});
test('logout clears queue and rejects a late response', async () => {
    let release;
    let count=0;
    const api={async get() {
        count++;
        if(count===2) await new Promise(resolve=>{release=resolve;});
        return {data:{items:[{ID:1}],total:1,unread:1,page:1,page_size:50}};
    }};
    const {store,storage}=setup(api);
    await store.refreshNotifications();
    storage.delete('user-token');
    await store.refreshNotifications();
    release();
    await flush();
    assert.equal(store.notificationsState.toastItems.length,0);
    assert.equal(store.notificationsState.toastOwner,'');
});
test('login of another user replaces the owner and queue', async () => {
    const api={async get() { return {data:{items:[{ID:7}],total:1,unread:1,page:1,page_size:50}}; }};
    const {store,storage}=setup(api);
    await store.refreshNotifications();
    await flush();
    assert.equal(store.notificationsState.toastOwner,'1');
    storage.set('user-token','token-b'); storage.set('user-id','2');
    await store.refreshNotifications();
    await flush();
    assert.equal(store.notificationsState.toastOwner,'2');
});
// --------- конец нового кода chat
