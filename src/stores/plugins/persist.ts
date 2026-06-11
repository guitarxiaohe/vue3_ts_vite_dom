import type { PiniaPluginContext } from 'pinia';

export interface PiniaPersistOptions {
  key?: string;
  pick?: string[];
  storage?: Storage;
}

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean | PiniaPersistOptions;
  }
}

function pickState(state: Record<string, unknown>, pick: string[] | undefined) {
  if (!pick || pick.length === 0) {
    return state;
  }

  return pick.reduce<Record<string, unknown>>((result, key) => {
    result[key] = state[key];
    return result;
  }, {});
}

export function createPersistPlugin() {
  return ({ options, store }: PiniaPluginContext) => {
    const persist = options.persist;
    if (!persist) {
      return;
    }

    const resolved =
      persist === true
        ? { key: `pinia:${store.$id}`, storage: localStorage, pick: undefined }
        : {
            key: persist.key || `pinia:${store.$id}`,
            storage: persist.storage || localStorage,
            pick: persist.pick,
          };

    const cached = resolved.storage.getItem(resolved.key);
    if (cached) {
      try {
        store.$patch(JSON.parse(cached));
      } catch (error) {
        console.warn(`Failed to restore persisted store: ${store.$id}`, error);
      }
    }

    store.$subscribe(
      (_mutation, state) => {
        const payload = pickState(
          state as unknown as Record<string, unknown>,
          resolved.pick
        );
        resolved.storage.setItem(resolved.key, JSON.stringify(payload));
      },
      { detached: true }
    );
  };
}
