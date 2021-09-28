import App from './App.svelte';
import * as lib from "@iota/client-wasm/web/";
// export lib here to it can be used in the browser console like this
// async function test(){
//     let iota_client = await new globalThis.app.lib.ClientBuilder().node("https://chrysalis-nodes.iota.org/").build();
//     // Get the nodeinfo
//     console.log(await iota_client.getInfo());
// }
// test()
const app = new App({
	target: document.body
});

export {
	app, lib
}