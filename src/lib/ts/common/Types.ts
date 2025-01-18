import S_Mouse from '../state/S_Mouse';

export type Handle_Boolean = (flag: boolean) => void;
export type Integer = number & { __brand: 'integer' };
export type Dictionary<T = any> = { [key: string]: T };
export type Handle_Result<T = Object, U = void> = (result: T) => U;
export type Handle_S_Mouse = Handle_Result<S_Mouse, boolean>;
export type Create_S_Mouse = (event: MouseEvent | null, element: HTMLElement) => S_Mouse;
