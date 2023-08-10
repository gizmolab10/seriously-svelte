<script>
  import { Thing, hierarchy, onMount } from '../common/GlobalImports';
  import { firebase } from '../managers/Firebase.ts';
  let things = [];

  onMount(async () => {
    await firebase.fetchAll();
    things = hierarchy.things;
  });
</script>

Firestore!
<ul>
  {#each things as thing}
    <li>{thing.title}</li>
  {/each}
</ul>
