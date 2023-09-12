import { writable } from 'svelte/store';

export const stoppedIDEditing   = writable<string | null>();
export const popupViewID        = writable<string | null>();
export const idEditing          = writable<string | null>();
export const idHere             = writable<string | null>();
export const bulkName           = writable<string>();
export const dbType             = writable<string>();
export const idsGrabbed         = writable<string[]>();
export const thingsArrived      = writable<boolean>();
export const showDetails        = writable<boolean>();
export const isBusy             = writable<boolean>();
export const debug              = writable<boolean>();
export const lineGap            = writable<number>();
export const lineStretch        = writable<number>();
export const build              = writable<number>();
