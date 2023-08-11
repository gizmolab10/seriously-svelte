<script>
  import { cloudEditor, hierarchy, onMount } from '../common/GlobalImports'
  onMount(async () => { hierarchy.setup(() => { things = hierarchy.things; }) })
  const build = 18; // eliminate signals
  let things = [];
</script>

Firestore!
<ul>
  {#each things as thing}
    <li>{thing.title}</li>
  {/each}
</ul>
