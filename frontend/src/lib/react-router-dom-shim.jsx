'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { useRouter, usePathname, useParams as useNextParams } from 'next/navigation';

/**
 * Context for nested Route outlets
 */
const OutletContext = createContext(null);

/**
 * Provider for Outlet context
 */
export function OutletProvider({ value, children }) {
  return <OutletContext.Provider value={value}>{children}</OutletContext.Provider>;
}

/**
 * Renders matching child component within a parent layout
 */
export function Outlet() {
  return useContext(OutletContext);
}

/**
 * React Router compatible Link component wrapping Next.js Link
 */
export function Link({ to, href, children, ...props }) {
  return (
    <NextLink href={href || to || '#'} {...props}>
      {children}
    </NextLink>
  );
}

const NAV_STATE_STORAGE_KEY = '__foryo_nav_state__';
let navigationState = null;

const writeNavigationState = (state) => {
  navigationState = state ?? null;
  if (typeof window === 'undefined') return;
  try {
    if (navigationState === null || navigationState === undefined) {
      window.sessionStorage.removeItem(NAV_STATE_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(NAV_STATE_STORAGE_KEY, JSON.stringify(navigationState));
    }
  } catch (_) {}
};

const readNavigationState = () => {
  if (navigationState !== null) return navigationState;
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(NAV_STATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

// Singleton history observer so multiple useSearchParams() hooks never clobber
// each other or Next.js App Router's history.pushState/replaceState wrappers on unmount.
const searchListeners = new Set();
let historyObserverInstalled = false;

const notifySearchListeners = () => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => {
      searchListeners.forEach((fn) => fn());
    });
  } else {
    setTimeout(() => {
      searchListeners.forEach((fn) => fn());
    }, 0);
  }
};

const ensureHistoryObserver = () => {
  if (historyObserverInstalled || typeof window === 'undefined') return;
  historyObserverInstalled = true;

  const origPush = window.history.pushState.bind(window.history);
  const origReplace = window.history.replaceState.bind(window.history);

  window.history.pushState = function (...args) {
    const result = origPush(...args);
    notifySearchListeners();
    return result;
  };

  window.history.replaceState = function (...args) {
    const result = origReplace(...args);
    notifySearchListeners();
    return result;
  };

  window.addEventListener('popstate', notifySearchListeners);
};

export function useNavigate() {
  const router = useRouter();
  return (to, options = {}) => {
    if (typeof to === 'number') {
      if (to < 0) router.back();
      return;
    }
    if (options?.state !== undefined) {
      writeNavigationState(options.state);
    } else {
      writeNavigationState(null);
    }
    if (options?.replace) {
      router.replace(to);
      return;
    }
    router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname() || '/';
  const [search, setSearch] = useState('');

  const [routeState, setRouteState] = useState(() => ({
    pathname,
    state: null,
  }));

  useEffect(() => {
    const syncSearch = () => {
      setSearch(typeof window !== 'undefined' ? window.location.search || '' : '');
    };
    syncSearch();
    ensureHistoryObserver();
    searchListeners.add(syncSearch);
    return () => {
      searchListeners.delete(syncSearch);
    };
  }, [pathname]);

  useEffect(() => {
    const pending = readNavigationState();
    if (routeState.pathname !== pathname) {
      writeNavigationState(null);
      setRouteState({ pathname, state: pending });
    } else if (pending !== null) {
      writeNavigationState(null);
      if (routeState.state !== pending) {
        setRouteState({ pathname, state: pending });
      }
    }
  }, [pathname, routeState.pathname, routeState.state]);

  const activeState = routeState.pathname === pathname ? routeState.state : readNavigationState();

  return {
    pathname,
    search,
    hash: '',
    state: activeState,
  };
}

export function useParams() {
  return useNextParams() || {};
}

export function useSearchParams() {
  const router = useRouter();
  const pathname = usePathname() || '/';

  const getSearch = () =>
    typeof window !== 'undefined' ? window.location.search.replace(/^\?/, '') : '';

  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    setSearchText(getSearch());
  }, [pathname]);

  useEffect(() => {
    ensureHistoryObserver();
    const syncSearch = () => setSearchText(getSearch());
    syncSearch();
    searchListeners.add(syncSearch);
    return () => {
      searchListeners.delete(syncSearch);
    };
  }, []);

  const current = useMemo(() => new URLSearchParams(searchText), [searchText]);

  const setSearchParams = (nextValue) => {
    let nextParams;
    if (nextValue instanceof URLSearchParams) {
      nextParams = new URLSearchParams(nextValue);
    } else if (typeof nextValue === 'string') {
      nextParams = new URLSearchParams(nextValue);
    } else if (nextValue && typeof nextValue === 'object') {
      nextParams = new URLSearchParams();
      Object.entries(nextValue).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          nextParams.set(key, String(value));
        }
      });
    } else {
      nextParams = new URLSearchParams();
    }

    const query = nextParams.toString();
    setSearchText(query);
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    router.push(nextUrl);
  };

  return [current, setSearchParams];
}

export function Navigate({ to, replace, state }) {
  const router = useRouter();

  useEffect(() => {
    if (state !== undefined) {
      writeNavigationState(state);
    }
    if (replace) router.replace(to);
    else router.push(to);
  }, [router, to, replace, state]);

  return null;
}

export function Route() {
  return null;
}

export function Routes({ children }) {
  const pathname = usePathname() || '/';
  const routeDefs = React.Children.toArray(children)
    .filter((child) => React.isValidElement(child))
    .map((child) => child.props);

  let matched = routeDefs.find((route) => {
    if (!route.path || route.index) return false;
    if (route.path.startsWith('/')) return pathname === route.path;
    return pathname.endsWith(`/${route.path}`);
  });

  if (!matched) {
    matched = routeDefs.find((route) => route.path === '*');
  }

  if (!matched) {
    matched = routeDefs.find((route) => route.index);
  }

  return matched?.element || null;
}
