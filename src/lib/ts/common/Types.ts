import { Mouse_State } from './Global_Imports';

export type Handle_Mouse_State = (mouseData: Mouse_State) => boolean;
export type Create_Mouse_State = (event: MouseEvent | null, element: HTMLElement) => Mouse_State;
