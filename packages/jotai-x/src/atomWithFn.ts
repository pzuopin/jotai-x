import { atom } from 'jotai';

import type { WritableAtom } from 'jotai/vanilla';

/**
 * 如果 T 是一个函数，则将其包装在一个对象中，否则保持不变。
 */
type WrapFn<T> = T extends (...args: infer _A) => infer _R ? { __fn: T } : T;

/**
 * 实现 WrapFn 类型，将函数包装在对象中。
 * @param fnOrValue 
 * @returns 
 */
const wrapFn = <T>(fnOrValue: T): WrapFn<T> =>
  (typeof fnOrValue === 'function' ? { __fn: fnOrValue } : fnOrValue) as any;

/**
 * 如果 T 是一个包含 __fn 属性的对象，则返回 __fn 属性的值，否则保持不变。
 */
type UnwrapFn<T> = T extends { __fn: infer U } ? U : T;

/**
 * 实现 UnwrapFn 类型，从对象中提取函数
 * @param wrappedFnOrValue 
 * @returns 
 */
const unwrapFn = <T>(wrappedFnOrValue: T): UnwrapFn<T> =>
  (wrappedFnOrValue &&
  typeof wrappedFnOrValue === 'object' &&
  '__fn' in wrappedFnOrValue
    ? wrappedFnOrValue.__fn
    : wrappedFnOrValue) as any;

/**
 * Jotai atoms don't allow functions as values by default. This function is a
 * drop-in replacement for `atom` that wraps functions in an object while
 * leaving non-functions unchanged. The wrapper object should be completely
 * invisible to consumers of the atom.
 * 
 * 接受一个初始值 initialValue，并使用 atom 创建一个基础原子 baseAtom，该原子存储的是 initialValue 的包装值。
 * 
 * 这个函数的主要目的是允许在 Jotai 原子中存储函数。
 * 由于 Jotai 原子默认不支持函数作为值，这个函数通过在函数周围添加一个包装对象来解决这个问题，使得函数可以像普通值一样存储在原子中。
 * 这段代码的目的是为了解决 Jotai 原子不支持函数作为值的问题，通过在函数周围添加一个包装对象来实现这一点。
 * 这在某些情况下可能很有用，比如当你需要在原子中存储一个函数，并且希望在读取时能够直接获取到这个函数，而不是一个包装对象。
 */
export const atomWithFn = <T>(initialValue: T): WritableAtom<T, [T], void> => {
  const baseAtom = atom(wrapFn(initialValue));

  // 返回一个新的原子，该原子在读取时调用 unwrapFn 来提取函数，在设置时调用 wrapFn 来包装函数
  return atom(
    (get) => unwrapFn(get(baseAtom)) as T,
    (_get, set, value) => set(baseAtom, wrapFn(value))
  );
};
