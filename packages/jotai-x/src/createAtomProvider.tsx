'use client';

import React from 'react';
import { createStore } from 'jotai/vanilla';

import { JotaiStore, SimpleWritableAtomRecord } from './createAtomStore';
import { useHydrateStore, useSyncStore } from './useHydrateStore';

/**
 * 返回一个字符串，表示完全限定的作用域，由存储名称和作用域组成。
 * @param storeName 
 * @param scope 
 * @returns 
 */
const getFullyQualifiedScope = (storeName: string, scope: string) => {
  return `${storeName}:${scope}`;
};

/**
 * Context mapping store name and scope to store. The 'provider' scope is used
 * to reference any provider belonging to the store, regardless of scope.
 */
const PROVIDER_SCOPE = 'provider';
const AtomStoreContext = React.createContext<Map<string, JotaiStore>>(
  new Map()
);

/**
 * Tries to find a store in each of the following places, in order:
 * 1. The store context, matching the store name and scope
 * 2. The store context, matching the store name and 'provider' scope
 * 3. Otherwise, return undefined
 * 
 * 尝试在以下位置按顺序查找存储：
 *    存储上下文，匹配存储名称和作用域。
 *    存储上下文，匹配存储名称和 'provider' 作用域。
 *    否则，返回 undefined。
 */
export const useAtomStore = (
  storeName: string,
  scope: string = PROVIDER_SCOPE,
  warnIfUndefined: boolean = true
): JotaiStore | undefined => {
  // 使用 React.useContext 钩子获取存储上下文。
  const storeContext = React.useContext(AtomStoreContext);
  // 尝试在存储上下文中查找完全限定作用域的存储，如果找不到，则尝试查找存储名称和 'provider' 作用域的存储。
  const store =
    storeContext.get(getFullyQualifiedScope(storeName, scope)) ??
    storeContext.get(getFullyQualifiedScope(storeName, PROVIDER_SCOPE));

  // 如果找不到存储并且 warnIfUndefined 为真，则打印警告信息。
  if (!store && warnIfUndefined) {
    console.warn(
      `Tried to access jotai store '${storeName}' outside of a matching provider.`
    );
  }

  // 返回找到的存储或 undefined。
  return store;
};

/**
 * 定义了提供者组件的属性类型。
 */
export type ProviderProps<T extends object> = Partial<T> & {
  store?: JotaiStore;
  scope?: string;
  initialValues?: Partial<T>;
  resetKey?: any;
  children: React.ReactNode;
};

/**
 * 使用 useHydrateStore 和 useSyncStore 钩子来初始化和同步原子状态。
 * @param param0 
 * @returns 
 */
export const HydrateAtoms = <T extends object>({
  initialValues,
  children,
  store,
  atoms,
  ...props
}: Omit<ProviderProps<T>, 'scope'> & {
  atoms: SimpleWritableAtomRecord<T>;
}) => {
  useHydrateStore(atoms, { ...initialValues, ...props } as any, {
    store,
  });
  useSyncStore(atoms, props as any, {
    store,
  });

  return <>{children}</>;
};

/**
 * Creates a generic provider for a jotai store.
 * - `initialValues`: Initial values for the store.
 * - `props`: Dynamic values for the store.
 * 
 * 接受存储作用域、原子和选项作为参数。
 * 返回一个 React 组件，该组件创建一个新的 Jotai 存储上下文，并将原子存储添加到上下文中。
 * 使用 HydrateAtoms 组件来初始化和同步原子状态。
 * 
 * 这段代码的主要目的是创建和管理 Jotai 原子存储。
 * 它通过使用 React 的上下文（Context）和钩子（Hooks）来实现这一点。useAtomStore 钩子允许你在任何地方访问存储，
 * 
 * 而 createAtomProvider 函数允许你创建一个新的存储上下文，并将原子存储添加到其中。
 */
export const createAtomProvider = <T extends object, N extends string = ''>(
  storeScope: N,
  atoms: SimpleWritableAtomRecord<T>,
  options: { effect?: React.FC } = {}
) => {
  const Effect = options.effect;

  // 这个返回的是一个函数
  // eslint-disable-next-line react/display-name
  return ({ store, scope, children, resetKey, ...props }: ProviderProps<T>) => {
    const [storeState, setStoreState] =
      React.useState<JotaiStore>(createStore());

    React.useEffect(() => {
      // 这里很明显  resetKey只是作为一个标志，当resetKey发生变化时，重新创建一个store
      if (resetKey) {
        setStoreState(createStore());
      }
    }, [resetKey]);

    const previousStoreContext = React.useContext(AtomStoreContext);

    const storeContext = React.useMemo(() => {
      const newStoreContext = new Map(previousStoreContext);

      if (scope) {
        // Make the store findable by its fully qualified scope
        newStoreContext.set(
          getFullyQualifiedScope(storeScope, scope),
          storeState
        );
      }

      // 所以这里我们可以看到 如果没有作用域的话 ，存储上下文会默认使用 'provider' 作用域
      // Make the store findable by its store name alone
      newStoreContext.set(
        getFullyQualifiedScope(storeScope, PROVIDER_SCOPE),
        storeState
      );

      return newStoreContext;
    }, [previousStoreContext, scope, storeState]);

    // 返回一个 React 组件，该组件创建一个新的 Jotai 存储上下文，并将原子存储添加到上下文中。
    // 使用 HydrateAtoms 组件来初始化和同步原子状态。
    return (
      <AtomStoreContext.Provider value={storeContext}>
        <HydrateAtoms store={storeState} atoms={atoms} {...(props as any)}>
          {!!Effect && <Effect />}

          {children}
        </HydrateAtoms>
      </AtomStoreContext.Provider>
    );
  };
};
