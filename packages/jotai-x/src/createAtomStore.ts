import React from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

import { atomWithFn } from './atomWithFn';
import { createAtomProvider, useAtomStore } from './createAtomProvider';

import type { ProviderProps } from './createAtomProvider';
import type { Atom, createStore, WritableAtom } from 'jotai/vanilla';

/**
 * 表示一个 Jotai 存储的类型，它是 createStore 函数的返回值。
 */
export type JotaiStore = ReturnType<typeof createStore>;

/**
 * 定义了使用 Jotai 原子的选项，包括作用域、存储、延迟和是否警告未定义存储。
 */
export type UseAtomOptions = {
  scope?: string;
  store?: JotaiStore;
  delay?: number;
  warnIfNoStore?: boolean;
};

/**
 * 以是 UseAtomOptions 类型或字符串类型。
 */
type UseAtomOptionsOrScope = UseAtomOptions | string;

/**
 * 用于创建一个对象，其中每个属性都是一个函数，该函数可以读取 Jotai 原子的值
 * 接受一个对象 O，返回一个新的对象，其中每个属性都是一个函数，该函数接受UseAtomOptionsOrScope 类型的参数，并返回 O 中对应属性的值。
 */
type GetRecord<O> = {
  [K in keyof O]: O[K] extends Atom<infer V>
    ? (options?: UseAtomOptionsOrScope) => V
    : never;
};

/**
 * 用于创建一个对象，其中每个属性都是一个函数，该函数可以设置 Jotai 原子的值。
 * 
 * 接受一个对象 O，返回一个新的对象，其中每个属性都是一个函数，
 * 该函数接受 UseAtomOptionsOrScope 类型的参数，并返回一个函数，该函数接受 O 中对应属性的值，并返回一个结果。
 */
type SetRecord<O> = {
  [K in keyof O]: O[K] extends WritableAtom<infer _V, infer A, infer R>
    ? (options?: UseAtomOptionsOrScope) => (...args: A) => R
    : never;
};

/**
 * 用于创建一个对象，其中每个属性都是一个函数，该函数可以读取和设置 Jotai 原子的值。
 * 接受一个对象 O，返回一个新的对象，其中每个属性都是一个函数，该函数接受 UseAtomOptionsOrScope 类型的参数，并返回一个数组，
 * 数组中第一个元素是 O 中对应属性的值，第二个元素是一个函数，该函数接受 O 中对应属性的值，并返回一个结果。
 */
type UseRecord<O> = {
  [K in keyof O]: O[K] extends WritableAtom<infer V, infer A, infer R>
    ? (options?: UseAtomOptionsOrScope) => [V, (...args: A) => R]
    : never;
};

/**
 * 接受一个对象 T，返回一个新的对象，其中每个属性都是一个原子，如果 T 中对应属性的值是一个原子，则直接使用该原子，否则创建一个新的原子来存储该值。
 */
type StoreAtomsWithoutExtend<T> = {
  [K in keyof T]: T[K] extends Atom<any> ? T[K] : SimpleWritableAtom<T[K]>;
};

/**
 * ValueTypesForAtoms：接受一个对象 T，返回一个新的对象，其中每个属性都是一个值，如果 T 中对应属性的值是一个原子，则返回该原子的值，否则返回该值。
 */
type ValueTypesForAtoms<T> = {
  [K in keyof T]: T[K] extends Atom<infer V> ? V : never;
};

/**
 * 用于创建一个对象，其中每个属性都是一个值，如果 T 中对应属性的值是一个原子，则返回该原子的值，否则返回该值。
 * 
 * 接受一个对象 T，返回一个新的对象，其中每个属性都是一个值，如果 T 中对应属性的值是一个原子，则返回该原子的值，否则返回该值。
 */
type StoreInitialValues<T> = ValueTypesForAtoms<StoreAtomsWithoutExtend<T>>;

/**
 * 用于创建一个对象，其中每个属性都是一个原子，如果 T 中对应属性的值是一个原子，则直接使用该原子，否则创建一个新的原子来存储该值。
 * 
 * 接受一个对象 T 和一个对象 E，返回一个新的对象，其中每个属性都是一个原子，
 * 如果 T 中对应属性的值是一个原子，则直接使用该原子，否则创建一个新的原子来存储该值。然后，将 E 中的属性添加到返回的对象中。
 */
type StoreAtoms<T, E> = StoreAtomsWithoutExtend<T> & E;

/**
 * 接受一个对象 T，返回一个新的对象，其中每个属性都是一个可写的原子，如果 T 中对应属性的值是一个可写的原子，则直接使用该原子，否则忽略该属性。
 */
type FilterWritableAtoms<T> = {
  [K in keyof T]-?: T[K] extends WritableAtom<any, any, any> ? T[K] : never;
};

/**
 * 用于创建一个对象，其中每个属性都是一个可写的原子，如果 T 中对应属性的值是一个可写的原子，则直接使用该原子，否则忽略该属性。
 * 
 * 接受一个对象 T 和一个对象 E，返回一个新的对象，其中每个属性都是一个可写的原子，
 * 如果 T 中对应属性的值是一个可写的原子，则直接使用该原子，否则忽略该属性。然后，将 E 中的属性添加到返回的对象中。
 */
type WritableStoreAtoms<T, E> = FilterWritableAtoms<StoreAtoms<T, E>>;

/**
 * 表示一个简单的可写原子，接受一个值 T，并返回一个函数，该函数接受一个值 T，并返回一个结果。
 */
export type SimpleWritableAtom<T> = WritableAtom<T, [T], void>;

/**
 * 接受一个对象 T，返回一个新的对象，其中每个属性都是一个简单的可写原子，如果 T 中对应属性的值是一个原子，则创建一个新的简单的可写原子来存储该值。
 */
export type SimpleWritableAtomRecord<T> = {
  [K in keyof T]: SimpleWritableAtom<T[K]>;
};

/**
 * 接受一个对象 O，返回一个新的对象，其中每个属性都是一个原子，如果 O 中对应属性的值是一个原子，则直接使用该原子，否则创建一个新的原子来存储该值。
 */
export type AtomRecord<O> = {
  [K in keyof O]: Atom<O[K]>;
};

type UseNameStore<N extends string = ''> = `use${Capitalize<N>}Store`;
type NameStore<N extends string = ''> = N extends '' ? 'store' : `${N}Store`;
type NameProvider<N extends string = ''> = `${Capitalize<N>}Provider`;
/**
 * 用于创建一个函数，该函数可以初始化 Jotai 原子。
 * 
 * 接受一个对象 T，返回一个新的函数，该函数接受一个部分记录 initialValues 和一个可选的 useHydrateAtoms 函数的参数，并返回一个结果。
 */
export type UseHydrateAtoms<T> = (
  initialValues: Partial<Record<keyof T, any>>,
  options?: Parameters<typeof useHydrateAtoms>[1]
) => void;
/**
 * 用于创建一个函数，该函数可以同步 Jotai 原子的值。
 * 
 * 接受一个对象 T，返回一个新的函数，该函数接受一个部分记录 values 和一个可选的包含 store 属性的对象，并返回一个结果。
 */
export type UseSyncAtoms<T> = (
  values: Partial<Record<keyof T, any>>,
  options?: {
    store?: JotaiStore;
  }
) => void;

/**
 * 用于创建一个对象，该对象包含一个存储原子和一个存储名称。
 */
export type StoreApi<
  T extends object,
  E extends AtomRecord<object>,
  N extends string = '',
> = {
  atom: StoreAtoms<T, E>;
  name: N;
};

/**
 * 接受一个原子 atom 和一个可选的 UseAtomOptionsOrScope 参数，返回一个值 V。
 */
type GetAtomFn = <V>(atom: Atom<V>, options?: UseAtomOptionsOrScope) => V;

/**
 * 接受一个可写原子 atom、一个可选的 UseAtomOptionsOrScope 参数，并返回一个函数，该函数接受一个或多个参数 A，并返回一个结果 R。
 */
type SetAtomFn = <V, A extends unknown[], R>(
  atom: WritableAtom<V, A, R>,
  options?: UseAtomOptionsOrScope
) => (...args: A) => R;

/**
 * 接受一个可写原子 atom、一个可选的 UseAtomOptionsOrScope 参数，并返回一个数组，
 * 数组中第一个元素是一个值 V，第二个元素是一个函数，该函数接受一个或多个参数 A，并返回一个结果 R。
 */
type UseAtomFn = <V, A extends unknown[], R>(
  atom: WritableAtom<V, A, R>,
  options?: UseAtomOptionsOrScope
) => [V, (...args: A) => R];

export type UseStoreApi<T, E> = (options?: UseAtomOptionsOrScope) => {
  // 表示一个对象，其中每个属性都是一个函数，该函数可以读取 StoreAtoms<T, E> 中对应属性的值，或者读取 StoreAtoms<T, E> 本身。
  get: GetRecord<StoreAtoms<T, E>> & { atom: GetAtomFn };
  // 表示一个对象，其中每个属性都是一个函数，该函数可以设置 WritableStoreAtoms<T, E> 中对应属性的值，或者设置 WritableStoreAtoms<T, E> 本身。
  set: SetRecord<WritableStoreAtoms<T, E>> & { atom: SetAtomFn };
  // 表示一个对象，其中每个属性都是一个函数，该函数可以读取和设置 WritableStoreAtoms<T, E> 中对应属性的值，或者读取和设置 WritableStoreAtoms<T, E> 本身
  use: UseRecord<WritableStoreAtoms<T, E>> & { atom: UseAtomFn };
  // 表示一个函数，该函数可以返回 JotaiStore 或 undefined。
  store: (options?: UseAtomOptionsOrScope) => JotaiStore | undefined;
};

export type AtomStoreApi<
  T extends object,
  E extends AtomRecord<object>,
  N extends string = '',
> = {
  // name：表示存储的名称，类型为 N。这里其实就是字符串
  name: N;
} & {
  // 表示一个对象，其中每个属性都是一个 React 组件，该组件接受 ProviderProps<StoreInitialValues<T>> 类型的参数。
  [key in keyof Record<NameProvider<N>, object>]: React.FC<
    ProviderProps<StoreInitialValues<T>>
  >;
} & {
  // 表示一个对象，其中每个属性都是一个 StoreApi<T, E, N> 类型的对象。
  [key in keyof Record<NameStore<N>, object>]: StoreApi<T, E, N>;
} & {
  // 表示一个对象，其中每个属性都是一个 UseStoreApi<T, E> 类型的对象。
  [key in keyof Record<UseNameStore<N>, object>]: UseStoreApi<T, E>;
};

/**
 * 接受一个字符串 str，返回一个新的字符串，该字符串的第一个字母大写，其余部分不变
 * @param str 
 * @returns 
 */
const capitalizeFirstLetter = (str = '') =>
  str.length > 0 ? str[0].toUpperCase() + str.slice(1) : '';
const getProviderIndex = (name = '') =>
  `${capitalizeFirstLetter(name)}Provider`;

/**
 * 接受一个字符串 name，返回一个新的字符串，如果 name 为空字符串，则返回 "store"，否则返回 name。
 * @param name 
 * @returns 
 */
const getStoreIndex = (name = '') =>
  name.length > 0 ? `${name}Store` : 'store';
const getUseStoreIndex = (name = '') =>
  `use${capitalizeFirstLetter(name)}Store`;

/**
 * 用于判断一个值是否是 Jotai 原子。
 * 
 * 如果 possibleAtom 是一个对象，并且具有 read 属性，并且 read 属性是一个函数，则返回 true，否则返回 false。
 * @param possibleAtom 
 * @returns 
 */
const isAtom = (possibleAtom: unknown): boolean =>
  !!possibleAtom &&
  typeof possibleAtom === 'object' &&
  'read' in possibleAtom &&
  typeof possibleAtom.read === 'function';

/**
 * 用于为函数记录添加默认选项。
 * 这个函数的主要目的是为了为函数记录添加默认选项。
 * withDefaultOptions 函数用于创建一个新的对象，该对象包含 fnRecord 中的函数，并且每个函数都接受一个可选的 UseAtomOptions 参数，该参数包含默认选项。
 * @param fnRecord 
 * @param defaultOptions 
 * @returns 
 */
const withDefaultOptions = <T extends object>(
  fnRecord: T,
  defaultOptions: UseAtomOptions
): T =>
  Object.fromEntries(
    // fnRecord：表示一个对象，其中每个属性都是一个函数。
    // 使用 Object.entries 函数获取 fnRecord 的键值对，然后使用 map 函数为每个函数添加默认选项，最后使用 Object.fromEntries 函数将键值对转换回对象。
    Object.entries(fnRecord).map(([key, fn]) => [
      key,
      (options: UseAtomOptions = {}) =>
        (fn as any)({ ...defaultOptions, ...options }),
    ])
  ) as any;

/**
 * 用于将作用域简写转换为完整的 UseAtomOptions 对象。
 * @param optionsOrScope 
 * @returns 
 */
const convertScopeShorthand = (
  optionsOrScope: UseAtomOptionsOrScope = {}
): UseAtomOptions =>
  typeof optionsOrScope === 'string'
    ? { scope: optionsOrScope }
    : optionsOrScope;

/**
 * 这个接口的主要目的是为了创建 Jotai 原子存储的选项。
 * CreateAtomStoreOptions 接口用于定义一个对象，该对象包含存储的名称、延迟、React 组件和一个函数，该函数可以扩展原子。
 */
export interface CreateAtomStoreOptions<
  T extends object,
  E extends AtomRecord<object>,
  N extends string,
> {
  name: N; // 表示存储的名称，类型为 N。
  delay?: UseAtomOptions['delay'];
  effect?: React.FC; // 表示一个 React 组件，类型为 React.FC。
  extend?: (atomsWithoutExtend: StoreAtomsWithoutExtend<T>) => E;
}

/**
 * Create an atom store from an initial value.
 * Each property will have a getter and setter.
 *
 * @example
 * const { exampleStore, useExampleStore } = createAtomStore({ count: 1, say: 'hello' }, { name: 'example' as const })
 * const [count, setCount] = useExampleStore().use.count()
 * const say = useExampleStore().get.say()
 * const setSay = useExampleStore().set.say()
 * setSay('world')
 * const countAtom = exampleStore.atom.count
 */
export const createAtomStore = <
  T extends object,
  E extends AtomRecord<object>,
  N extends string = '',
>(
  initialState: T,
  { name, delay: delayRoot, effect, extend }: CreateAtomStoreOptions<T, E, N>
): AtomStoreApi<T, E, N> => {
  // 表示一个存储原子，类型为 StoreAtoms<T, E>
  type MyStoreAtoms = StoreAtoms<T, E>;
  // 表示一个可写的存储原子，类型为 WritableStoreAtoms<T, E>。
  type MyWritableStoreAtoms = WritableStoreAtoms<T, E>;
  // 表示一个不扩展的存储原子，类型为 StoreAtomsWithoutExtend<T>。
  type MyStoreAtomsWithoutExtend = StoreAtomsWithoutExtend<T>;
  //  表示一个不扩展的可写的存储原子，类型为 FilterWritableAtoms<MyStoreAtomsWithoutExtend>。
  type MyWritableStoreAtomsWithoutExtend =
    FilterWritableAtoms<MyStoreAtomsWithoutExtend>;
    // 表示一个存储的初始值，类型为 StoreInitialValues<T>。
  type MyStoreInitialValues = StoreInitialValues<T>;

  // 用于创建提供者、钩子和存储的名称。
  const providerIndex = getProviderIndex(name) as NameProvider<N>;
  const useStoreIndex = getUseStoreIndex(name) as UseNameStore<N>;
  const storeIndex = getStoreIndex(name) as NameStore<N>;

  // 表示一个不扩展的存储原子，类型为 MyStoreAtomsWithoutExtend。
  const atomsWithoutExtend = {} as MyStoreAtomsWithoutExtend;
  // 示一个不扩展的可写的存储原子，类型为 MyWritableStoreAtomsWithoutExtend。
  const writableAtomsWithoutExtend = {} as MyWritableStoreAtomsWithoutExtend;
  // 表示一个对象，其中每个属性都是一个布尔值，类型为 Record<keyof MyStoreAtoms, boolean>。
  const atomIsWritable = {} as Record<keyof MyStoreAtoms, boolean>;

  // 使用 Object.entries 函数获取 initialState 的键值对。
  for (const [key, atomOrValue] of Object.entries(initialState)) {
    // 将每个属性转换为 Jotai 原子 如果 atomOrValue 是一个 Jotai 原子，则直接使用它，否则使用 atomWithFn 函数创建一个新的 Jotai 原子。
    const atomConfig: Atom<unknown> = isAtom(atomOrValue)
      ? atomOrValue
      : atomWithFn(atomOrValue);
    // 存储在 atomsWithoutExtend 中
    // 将转换后的 Jotai 原子存储在 atomsWithoutExtend 对象中，键为 key，值为 atomConfig。
    atomsWithoutExtend[key as keyof MyStoreAtomsWithoutExtend] =
      atomConfig as any;

    // 存储每个原子的可写性
    // 如果 atomConfig 具有 write 属性，则将 atomIsWritable 对象中对应属性的值设置为 true，否则设置为 false。
    const writable = 'write' in atomConfig;
    atomIsWritable[key as keyof MyStoreAtoms] = writable;

    // 存储在 writableAtomsWithoutExtend 中
    if (writable) {
      // 如果 atomConfig 具有 write 属性，则将 atomConfig 存储在 writableAtomsWithoutExtend 对象中，键为 key，值为 atomConfig。
      writableAtomsWithoutExtend[
        key as keyof MyWritableStoreAtomsWithoutExtend
      ] = atomConfig as any;
    }
  }

  // 创建 atoms 对象
  // 使用扩展运算符 ... 将 atomsWithoutExtend 对象的属性复制到新的 atoms 对象中
  const atoms = { ...atomsWithoutExtend } as MyStoreAtoms;

  // 如果存在 extend 函数
  if (extend) {
    // 调用 extend 函数，将 atomsWithoutExtend 对象作为参数，返回一个新的对象 extendedAtoms。
    const extendedAtoms = extend(atomsWithoutExtend);

    // 遍历 extendedAtoms 对象 使用 Object.entries 函数获取 extendedAtoms 的键值对。
    for (const [key, atomConfig] of Object.entries(extendedAtoms)) {
      // 将扩展后的原子存储在 atoms 中
      // 将 extendedAtoms 对象中对应属性的值存储在 atoms 对象中，键为 key，值为 atomConfig。
      atoms[key as keyof MyStoreAtoms] = atomConfig;
      // 存储每个原子的可写性
      // 如果 atomConfig 具有 write 属性，则将 atomIsWritable 对象中对应属性的值设置为 true，否则设置为 false。
      atomIsWritable[key as keyof MyStoreAtoms] = 'write' in atomConfig;
    }
  }

  // 表示一个对象，其中每个属性都是一个函数，该函数可以读取 MyStoreAtoms 中对应属性的值，类型为 GetRecord<MyStoreAtoms>。
  const getAtoms = {} as GetRecord<MyStoreAtoms>;
  // 表示一个对象，其中每个属性都是一个函数，该函数可以设置 MyWritableStoreAtoms 中对应属性的值，类型为 SetRecord<MyWritableStoreAtoms>。
  const setAtoms = {} as SetRecord<MyWritableStoreAtoms>;
  // 表示一个对象，其中每个属性都是一个函数，该函数可以读取和设置 MyWritableStoreAtoms 中对应属性的值，类型为 UseRecord<MyWritableStoreAtoms>。
  const useAtoms = {} as UseRecord<MyWritableStoreAtoms>;

  // 接受一个可选的 UseAtomOptionsOrScope 类型的参数 optionsOrScope，返回一个 Jotai 存储对象。
  const useStore = (optionsOrScope: UseAtomOptionsOrScope = {}) => {
    // 使用 convertScopeShorthand 函数将 optionsOrScope 转换为 UseAtomOptions 对象。
    const {
      scope,
      store,
      warnIfNoStore = true,
    } = convertScopeShorthand(optionsOrScope);
    // 使用 useAtomStore 函数获取上下文存储，如果 store 属性为 false，则 warnIfNoStore 属性为 true。
    const contextStore = useAtomStore(name, scope, !store && warnIfNoStore);
    // 如果 store 属性存在，则返回 store，否则返回上下文存储。
    return store ?? contextStore;
  };

  // 用于读取 Jotai 原子的值
  const useAtomValueWithStore: GetAtomFn = (atomConfig, optionsOrScope) => {
    // 使用 convertScopeShorthand 函数将 optionsOrScope 转换为 UseAtomOptions 对象。
    const options = convertScopeShorthand(optionsOrScope);
    // 使用 useStore 函数获取存储，如果 store 属性为 false，则 warnIfNoStore 属性为 false。
    const store = useStore({ warnIfNoStore: false, ...options });
    // 使用 useAtomValue 函数读取 atomConfig 的值，并返回结果
    return useAtomValue(atomConfig, {
      store,
      delay: options.delay ?? delayRoot,
    });
  };

  // 用于设置 Jotai 原子的值
  const useSetAtomWithStore: SetAtomFn = (atomConfig, optionsOrScope) => {
    const store = useStore(optionsOrScope);
    // 使用 useSetAtom 函数设置 atomConfig 的值，并返回结果。
    return useSetAtom(atomConfig, { store });
  };

  // 用于读取和设置 Jotai 原子的值
  const useAtomWithStore: UseAtomFn = (atomConfig, optionsOrScope) => {
    const store = useStore(optionsOrScope);
    const { delay = delayRoot } = convertScopeShorthand(optionsOrScope);
    // 使用 useAtom 函数读取和设置 atomConfig 的值，并返回结果
    return useAtom(atomConfig, { store, delay });
  };

  // 每个属性都是一个函数，用于读取、设置和读取/设置 Jotai 原子的值。
  // 使用 Object.keys 函数获取 atoms 对象的键。
  for (const key of Object.keys(atoms)) {
    // 使用 atoms 对象的键获取对应的原子配置 atomConfig 和可写性 isWritable。
    const atomConfig = atoms[key as keyof MyStoreAtoms];
    const isWritable: boolean = atomIsWritable[key as keyof MyStoreAtoms];

    // 为 getAtoms 对象添加一个属性，属性名为 key，属性值为一个函数，该函数接受一个可选的 UseAtomOptionsOrScope 类型的参数 optionsOrScope，并返回一个值。
    (getAtoms as any)[key] = (optionsOrScope: UseAtomOptionsOrScope = {}) =>
      useAtomValueWithStore(atomConfig, optionsOrScope);

    // 如果原子是可写的
    if (isWritable) {
      // 为 setAtoms 对象添加一个属性，属性名为 key，属性值为一个函数，该函数接受一个可选的 UseAtomOptionsOrScope 类型的参数 optionsOrScope，并返回一个函数。
      (setAtoms as any)[key] = (optionsOrScope: UseAtomOptionsOrScope = {}) =>
        useSetAtomWithStore(
          atomConfig as WritableAtom<any, any, any>,
          optionsOrScope
        );

        // 为 useAtoms 对象添加一个属性，属性名为 key，属性值为一个函数，
        // 该函数接受一个可选的 UseAtomOptionsOrScope 类型的参数 optionsOrScope，并返回一个数组，数组中第一个元素是一个值，第二个元素是一个函数。
      (useAtoms as any)[key] = (optionsOrScope: UseAtomOptionsOrScope = {}) =>
        useAtomWithStore(
          atomConfig as WritableAtom<any, any, any>,
          optionsOrScope
        );
    }
  }

  // Provider：接受一个 ProviderProps<MyStoreInitialValues> 类型的参数，返回一个 React 元素。
  const Provider: React.FC<ProviderProps<MyStoreInitialValues>> =
    createAtomProvider<MyStoreInitialValues, N>(
      name,
      writableAtomsWithoutExtend,
      { effect }
    );

  // 用于存储 Jotai 原子存储
  const storeApi: StoreApi<T, E, N> = {
    atom: atoms,
    name,
  };

  // 接受一个可选的 UseAtomOptionsOrScope 类型的参数 defaultOptions，返回一个对象，该对象包含 get、set、use 和 store 属性。
  const useStoreApi: UseStoreApi<T, E> = (defaultOptions = {}) => ({
    // 表示一个对象，其中每个属性都是一个函数，该函数可以读取 Jotai 原子的值。
    get: {
      // 使用 withDefaultOptions 函数为 getAtoms 对象添加默认选项。
      ...withDefaultOptions(getAtoms, convertScopeShorthand(defaultOptions)),
      // 为 get 对象添加一个属性，属性名为 atom，属性值为一个函数，
      // 该函数接受一个原子配置 atomConfig 和一个可选的 UseAtomOptionsOrScope 类型的参数 options，并返回一个值。
      atom: (atomConfig, options) =>
        useAtomValueWithStore(atomConfig, {
          ...convertScopeShorthand(defaultOptions),
          ...convertScopeShorthand(options),
        }),
    },
    // 表示一个对象，其中每个属性都是一个函数，该函数可以设置 Jotai 原子的值。
    set: {
      // 使用 withDefaultOptions 函数为 setAtoms 对象添加默认选项。
      ...withDefaultOptions(setAtoms, convertScopeShorthand(defaultOptions)),
      // 为 set 对象添加一个属性，属性名为 atom，属性值为一个函数，
      // 该函数接受一个原子配置 atomConfig 和一个可选的 UseAtomOptionsOrScope 类型的参数 options，并返回一个函数。
      atom: (atomConfig, options) =>
        useSetAtomWithStore(atomConfig, {
          ...convertScopeShorthand(defaultOptions),
          ...convertScopeShorthand(options),
        }),
    },
    // 表示一个对象，其中每个属性都是一个函数，该函数可以读取和设置 Jotai 原子的值。
    use: {
      // 使用 withDefaultOptions 函数为 useAtoms 对象添加默认选项。
      ...withDefaultOptions(useAtoms, convertScopeShorthand(defaultOptions)),
      // 为 use 对象添加一个属性，属性名为 atom，属性值为一个函数，
      // 该函数接受一个原子配置 atomConfig 和一个可选的 UseAtomOptionsOrScope 类型的参数 options，并返回一个数组，数组中第一个元素是一个值，第二个元素是一个函数。
      atom: (atomConfig, options) =>
        useAtomWithStore(atomConfig, {
          ...convertScopeShorthand(defaultOptions),
          ...convertScopeShorthand(options),
        }),
    },
    // 表示一个函数，该函数可以返回 Jotai 存储对象。
    store: (options) =>
      // 使用 useStore 函数获取存储对象。
      useStore({
        ...convertScopeShorthand(defaultOptions),
        ...convertScopeShorthand(options),
      }),
  });

  return {
    [providerIndex]: Provider,
    [useStoreIndex]: useStoreApi,
    [storeIndex]: storeApi,
    name,
  } as any;
};
