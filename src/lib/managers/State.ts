import { QueryDocumentSnapshot } from 'firebase/firestore';
import { writable } from 'svelte/store';

export const thingsStore        = writable<{id:string}[]>();
export const predicatesStore    = writable<{id:string}[]>();
export const relationshipsStore = writable<{id:string}[]>();
export const stoppedEditingID   = writable<string | null>();
export const popupViewID        = writable<string | null>();
export const editingID          = writable<string | null>();
export const hereID             = writable<string | null>();
export const grabbedIDs         = writable<string[]>();
export const showDetails        = writable<boolean>();
export const isBusy             = writable<boolean>();
export const bulkName           = writable<string>();
export const dbType             = writable<string>();
export const build              = writable<number>();
