import SeriouslyApp from '/src/lib/svelte/main/SeriouslyApp.svelte';
import '/src/styles/app.css';
import { mount } from "svelte";

mount(SeriouslyApp, { target: document.body });

export { SeriouslyApp };
