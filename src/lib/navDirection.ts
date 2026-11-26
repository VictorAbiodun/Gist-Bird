'use client';

const TAB_ORDER: Record<string, number> = {
  '/home': 0,
  '/sent': 1,
  '/chats': 2,
  '/me': 3,
};

function getDepth(path: string): number {
  if (path in TAB_ORDER) return 0;
  if (
    path.startsWith('/settings/password') ||
    path.startsWith('/settings/blocked') ||
    path.startsWith('/settings/delete') ||
    path.startsWith('/report')
  ) {
    return 2;
  }
  return 1;
}

let lastPath: string | null = null;
let popStateTriggered = false;
let listenerAttached = false;

export function initNavDirectionListener() {
  if (typeof window === 'undefined' || listenerAttached) return;
  listenerAttached = true;
  window.addEventListener('popstate', () => {
    popStateTriggered = true;
  });
}

/**
 * Purely computes slide direction from `lastPath` to `nextPath`:
 *  1  = forward / right-to-left push
 * -1  = back / left-to-right pop
 *  0  = initial load or same route
 */
export function getNavDirection(nextPath: string): -1 | 0 | 1 {
  if (!lastPath || lastPath === nextPath) return 0;
  if (popStateTriggered) return -1;

  const prevTab = TAB_ORDER[lastPath];
  const nextTab = TAB_ORDER[nextPath];
  if (prevTab !== undefined && nextTab !== undefined) {
    return nextTab > prevTab ? 1 : -1;
  }

  const prevDepth = getDepth(lastPath);
  const nextDepth = getDepth(nextPath);
  if (nextDepth !== prevDepth) {
    return nextDepth > prevDepth ? 1 : -1;
  }

  return 1;
}

export function commitNavPath(path: string) {
  lastPath = path;
  popStateTriggered = false;
}
