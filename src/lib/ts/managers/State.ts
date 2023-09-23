import { writable } from 'svelte/store';

export const stoppedIDEditing	= writable<string | null>();
export const popupViewID			= writable<string | null>();
export const idEditing				= writable<string | null>();
export const idHere						= writable<string | null>();
export const dbLoadTime 			= writable<string | null>();
export const collapsed				= writable<string[]>();
export const idsGrabbed				= writable<string[]>();
export const thingsArrived		= writable<boolean>();
export const showDetails			= writable<boolean>();
export const isBusy						= writable<boolean>();
export const bulkName					= writable<string>();
export const dbType						= writable<string>();
export const widgetHeightGap	= writable<number>();
export const lineStretch			= writable<number>();
export const dotDiameter			= writable<number>();
export const build						= writable<number>();
