<svelte:options immutable = {true} />

<script>
  import { Entity, entities, grabbing, graphEditor, onMount, onDestroy, signal, handleSignal, SignalKinds, relationships } from '../common/imports.ts';
  import Widget from './Widget.svelte';
  let toggledReload = false;
  let isLoading = true;

  handleSignal.connect((kinds) => {
		if (kinds.includes(SignalKinds.fetch)) {
  		isLoading = false;
    } else if (kinds.includes(SignalKinds.graph)) {
      toggledReload = !toggledReload;
    }
  });

  onDestroy( () => { window.removeEventListener('keydown'); });

  onMount(async () => {
    window.addEventListener('keydown', graphEditor.handleKeyDown);
    try {
      entities.readAllFromCloud()
    } catch (error) {
      alert('Error reading Airtable database: ' + error);
    }
  });

  // function drawLine() {
  //   const ctx = canvas.getContext("2d");

  //   <canvas bind:this={canvas}>
  //   </canvas>
  //   let a = 100; // semi-major axis
  //   let e = 0.8; // eccentricity
  //   let b = a * Math.sqrt(1 - e * e); // semi-minor axis based on eccentricity

  //   ctx.beginPath();

  //   for (let angle = Math.PI; angle <= 1.5 * Math.PI; angle += 0.01) {
  //       let x = a * Math.cos(angle);
  //       let y = b * Math.sin(angle);
  //       ctx.lineTo(canvas.width / 2 + x, canvas.height / 2 - y);
  //   }

  //   ctx.stroke();
  // }

  </script>

{#key toggledReload}
  {#if isLoading}
    <p>Loading...</p>
  {:else if entities.all.length == 0}
    <p>No entities available.</p>
  {:else}
    <div>
      <ul>
        {#each entities.all as entity}
          <li>
            <Widget entity={entity}/>
          </li>
        {/each}
      </ul>
      <p/>
    </div>
  {/if}
{/key}

<style>
  p {
    font-size: 5em;
  }
  li {
    line-height: 1.5;
  }
  ul {
    list-style: none;
  }
</style>
