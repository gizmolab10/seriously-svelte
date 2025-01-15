import Mouse_State from '../state/Mouse_State';

export type Handle_Boolean = (flag: boolean) => void;
export type Integer = number & { __brand: 'integer' };
export type Dictionary<T = any> = { [key: string]: T };
export type Handle_Result<T = Object, U = void> = (result: T) => U;
export type Handle_Mouse_State = Handle_Result<Mouse_State, boolean>;
export type Create_Mouse_State = (event: MouseEvent | null, element: HTMLElement) => Mouse_State;
