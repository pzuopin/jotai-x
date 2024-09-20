import React from 'react';
import { useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

import {
  SimpleWritableAtomRecord,
  UseHydrateAtoms,
  UseSyncAtoms,
} from './createAtomStore';

/**
 * 这段代码的主要目的是初始化和同步 Jotai 原子存储。useHydrateStore 钩子用于在服务器端渲染（SSR）时初始化原子，useSyncStore 钩子用于在客户端更新原子。
 */
/**
 * Hydrate atoms with initial values for SSR.
 */
export const useHydrateStore = (
  atoms: SimpleWritableAtomRecord<any>,
  initialValues: Parameters<UseHydrateAtoms<any>>[0],
  options: Parameters<UseHydrateAtoms<any>>[1] = {}
) => {
  const values: any[] = [];

  // 遍历原子，将初始值添加到 values 数组中。
  for (const key of Object.keys(atoms)) {
    const initialValue = initialValues[key];

    if (initialValue !== undefined) {
      values.push([atoms[key], initialValue]);
    }
  }

  // 使用 useHydrateAtoms 钩子来初始化原子
  useHydrateAtoms(values, options);
};

/**
 * Update atoms with new values on changes.
 */
export const useSyncStore = (
  atoms: SimpleWritableAtomRecord<any>,
  values: any,
  { store }: Parameters<UseSyncAtoms<any>>[1] = {}
) => {
  // 遍历原子，获取每个原子的值和设置器。
  for (const key of Object.keys(atoms)) {
    const value = values[key];
    const atom = atoms[key];

    const set = useSetAtom(atom, { store });

    React.useEffect(() => {
      // 使用 useEffect 钩子来在值发生变化时更新原子。
      if (value !== undefined && value !== null) {
        set(value);
      }
    }, [set, value]);
  }
};
