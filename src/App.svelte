<script>
  import { crossfade } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import * as lib from "test-iota-client-wasm/web/";
  let node = "https://api.lb-0.testnet.chrysalis2.com/";
  import { writable } from "svelte/store";
  // save mnemonic to local storage
  let mnemonic = "";
  let mnemonic_store = writable(localStorage.getItem("mnemonic") || "");
  mnemonic_store.subscribe((val) => {
    localStorage.setItem("mnemonic", val);
    mnemonic = val;
  });
  let index = "";
  let data = "";
  let output_address = "";
  let output_amount;
  let address_index = 0;
  let output_types = [
    { type: `SignatureLockedSingle` },
    { type: `SignatureLockedDustAllowance` },
  ];
  let selected_output_type;
  let explorer_link = "https://explorer.iota.org/testnet";

  async function send_message() {
    try {
      await lib.init();
      let iota_client = await new lib.ClientBuilder().node(node).build();
      let message_builder = iota_client.message();
      if (index != "") {
        message_builder = message_builder.index(
          new TextEncoder().encode(index)
        );
        if (data != "") {
          message_builder = message_builder.data(
            new TextEncoder().encode(data)
          );
        }
      }
      if (mnemonic != "" && output_address != "" && output_amount != 0) {
        message_builder = message_builder.seed(
          iota_client.mnemonicToHexSeed(mnemonic)
        );
        if (selected_output_type.type == "SignatureLockedDustAllowance") {
          message_builder = message_builder.dustAllowanceOutput(
            output_address,
            BigInt(output_amount)
          );
        } else {
          message_builder = message_builder.output(
            output_address,
            BigInt(output_amount)
          );
        }
      }
      let message = await message_builder.submit();

      console.log(message);
      add(message);
      let network_info = await iota_client.networkInfo();
      if (network_info.bech32HRP == "iota") {
        explorer_link = `https://explorer.iota.org/mainnet/message/${message.messageId}`;
      } else {
        explorer_link = `https://explorer.iota.org/testnet/message/${message.messageId}`;
      }
      console.log(explorer_link);
    } catch (e) {
      console.log(e);
      add(e);
    }
  }
  async function get_messages() {
    try {
      await lib.init();
      let iota_client = await new lib.ClientBuilder().node(node).build();
      let messageIds = await iota_client
        .getMessage()
        .index(new TextEncoder().encode(index));
      console.log(messageIds);
      console.log(messageIds.length);
      let messages = [];
      for (let i = 0; i < messageIds.length; i++) {
        console.log(messageIds[i]);
        messages.push(await iota_client.getMessage().data(messageIds[i]));
      }
      console.log(messages);
      add(messages);
    } catch (e) {
      console.log(e);
      add(e);
    }
  }
  async function generate_mnemonic() {
    await lib.init();
    let iota_client = await new lib.ClientBuilder().node(node).build();
    mnemonic_store.set(iota_client.generateMnemonic());
    console.log(mnemonic);
    add(mnemonic);
  }
  async function generate_address() {
    try {
      await lib.init();
      let iota_client = await new lib.ClientBuilder().node(node).build();
      let addresses = await iota_client
        .getAddresses(iota_client.mnemonicToHexSeed(mnemonic))
        .accountIndex(0)
        .range(address_index, parseInt(address_index) + 1)
        .get();
      console.log(addresses);
      add(addresses[0]);
    } catch (e) {
      console.log(e);
      add(e);
    }
  }
  async function get_balance() {
    try {
      await lib.init();
      let iota_client = await new lib.ClientBuilder().node(node).build();
      let balance = await iota_client
        .getBalance(iota_client.mnemonicToHexSeed(mnemonic))
        .get();
      console.log(balance);
      add(balance);
    } catch (e) {
      console.log(e);
      add(e);
    }
  }
  async function one_mi() {
    output_amount = 1_000_000;
  }

  function clear_output() {
    results = [];
  }

  // results
  let results = [];

  let uid = results.length + 1;

  function add(result) {
    const res = {
      id: uid++,
      value: JSON.stringify(result, null, 1),
    };

    results = [res, ...results];
  }

  function remove(res) {
    results = results.filter((t) => t !== res);
  }
  const [send, receive] = crossfade({
    fallback(node, params) {
      const style = getComputedStyle(node);
      const transform = style.transform === "none" ? "" : style.transform;
      return {
        duration: 200,
        easing: quintOut,
        css: (t) => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`,
      };
    },
  });
</script>

<main>
  <h1>IOTA client</h1>

  <input bind:value={node} placeholder="IOTA node url" />
  <br />
  <input
    style="width: 80%;"
    bind:value={$mnemonic_store}
    placeholder="mnemonic (nevery enter your mainnet mnemonic)"
  />
  <button on:click={generate_mnemonic}>Generate mnemonic</button>
  <br />
  <input bind:value={index} placeholder="Enter an index" />
  <button on:click={get_messages}>Get messages with index</button>
  <br />
  <input bind:value={data} placeholder="Enter data" />
  <br />
  <input bind:value={output_address} placeholder="Address" />
  <input
    style="width: 10rem;"
    bind:value={output_amount}
    placeholder="Amount"
  />
  <button on:click={one_mi}>1 Mi</button>
  <select bind:value={selected_output_type}>
    {#each output_types as output}
      <option value={output}>
        {output.type}
      </option>
    {/each}
  </select>
  <br />
  <button on:click={send_message}>Send message</button>
  <button on:click={get_balance}>Get balance</button>
  <br />
  <input
    style="width: 10rem;"
    bind:value={address_index}
    placeholder="Address index"
  />
  <button on:click={generate_address}>Generate address</button>
  <br />
  <a href={explorer_link} target="_blank" rel="noopener noreferrer"
    >Explorer link for sent messages</a
  >
  <div class="results">
    {#each results as res (res.id)}
      <div
        style="display:inline;"
        in:receive={{ key: res.id }}
        out:send={{ key: res.id }}
      >
        {res.value}
      </div>
      <button on:click={() => remove(res)}>x</button>
      <br />
    {/each}
  </div>
  <br />
  <button on:click={clear_output}>Clear all outputs</button>
</main>
