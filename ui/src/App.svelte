<script lang="ts">
  import logo from "./assets/holochainLogo.svg";
  import ClientProvider from "./ClientProvider.svelte";
  import HREATest from "./HREATest.svelte";
</script>

<ClientProvider>
  <div>
    <div>
      <a href="https://developer.holochain.org/get-started/" target="_blank">
        <img src={logo} class="logo holochain" alt="holochain logo" />
      </a>
    </div>
    <h1>Holochain Svelte hApp</h1>
    <div>
      <div class="card">
        <p>Welcome to the hREA Basic Example!</p>
        <p>
          This demonstrates how to integrate hREA with Holochain using Svelte 5
          runes.
        </p>
      </div>

      <!-- hREA Basic Example -->
      <HREATest />
    </div>
  </div>
</ClientProvider>

<style>
  .logo {
    height: 15em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
    width: auto;
  }

  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }

  .logo.holochain:hover {
    filter: drop-shadow(0 0 2em #61dafbaa);
  }

  .card {
    padding: 2em;
  }

  .card p {
    color: #ccc;
    margin: 8px 0;
    line-height: 1.4;
  }
</style>
