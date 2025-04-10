import SeriouslyApp from './lib/svelte/main/SeriouslyApp.svelte';
import './styles/app.css';
import { mount } from "svelte";

mount(SeriouslyApp, { target: document.body });
