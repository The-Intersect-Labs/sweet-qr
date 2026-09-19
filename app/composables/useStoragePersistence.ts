/**
 * Persistent storage.
 *
 * localStorage is "best effort": browsers may evict it under storage pressure, and
 * Safari clears script-writable storage after a period without interaction unless the
 * site is installed. `navigator.storage.persist()` asks the browser to exempt this
 * origin from that automatic cleanup — it protects the user's library without them
 * having to do anything, which is why it is worth doing at all.
 *
 * Support varies: Chromium decides silently from engagement heuristics, Firefox shows a
 * permission prompt, and Safari does not implement it. Where it is unsupported the
 * honest advice is to install the app to the home screen.
 */

export type PersistenceState = 'unknown' | 'unsupported' | 'granted' | 'denied' | 'requesting'

function storageManager(): StorageManager | null {
  if (typeof navigator === 'undefined') return null

  const storage = navigator.storage as StorageManager | undefined
  if (!storage) return null
  if (typeof storage.persist !== 'function' || typeof storage.persisted !== 'function') return null
  return storage
}

export function useStoragePersistence() {
  const state = useState<PersistenceState>('sweetqr:persistence', () => 'unknown')

  /** Reads the current status without ever prompting. */
  async function refresh() {
    const storage = storageManager()
    if (!storage) {
      state.value = 'unsupported'
      return
    }

    try {
      state.value = (await storage.persisted()) ? 'granted' : 'denied'
    } catch {
      state.value = 'unsupported'
    }
  }

  /** Asks the browser to make this origin's storage persistent. */
  async function request(): Promise<boolean> {
    const storage = storageManager()
    if (!storage) {
      state.value = 'unsupported'
      return false
    }

    try {
      if (await storage.persisted()) {
        state.value = 'granted'
        return true
      }
    } catch {
      state.value = 'unsupported'
      return false
    }

    state.value = 'requesting'
    try {
      const granted = await storage.persist()
      state.value = granted ? 'granted' : 'denied'
      return granted
    } catch {
      state.value = 'denied'
      return false
    }
  }

  /**
   * Only asks once there is actually something to lose. Requesting on a cold first visit
   * would prompt a brand-new visitor who has nothing saved yet.
   */
  async function requestIfNeeded(hasData: boolean): Promise<boolean> {
    if (!hasData) return false
    await refresh()
    if (state.value === 'granted' || state.value === 'unsupported') return state.value === 'granted'
    return request()
  }

  return { state, refresh, request, requestIfNeeded }
}
