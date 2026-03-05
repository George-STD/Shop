'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import NextLink from 'next/link'
import {
  useRouter,
  usePathname,
  useParams as useNextParams,
} from 'next/navigation'

const OutletContext = createContext(null)

export function OutletProvider({ value, children }) {
  return <OutletContext.Provider value={value}>{children}</OutletContext.Provider>
}

export function Outlet() {
  return useContext(OutletContext)
}

export function Link({ to, href, children, ...props }) {
  return (
    <NextLink href={href || to || '#'} {...props}>
      {children}
    </NextLink>
  )
}

export function useNavigate() {
  const router = useRouter()
  return (to, options = {}) => {
    if (typeof to === 'number') {
      if (to < 0) router.back()
      return
    }
    if (options?.replace) {
      router.replace(to)
      return
    }
    router.push(to)
  }
}

export function useLocation() {
  const pathname = usePathname() || '/'
  const search = typeof window !== 'undefined' ? window.location.search || '' : ''
  return {
    pathname,
    search,
    hash: '',
  }
}

export function useParams() {
  return useNextParams() || {}
}

export function useSearchParams() {
  const router = useRouter()
  const pathname = usePathname() || '/'

  const getSearch = () =>
    typeof window !== 'undefined' ? window.location.search.replace(/^\?/, '') : ''

  const [searchText, setSearchText] = useState(getSearch)

  // Re-sync whenever the pathname changes (Next.js client navigation)
  // or on popstate (browser back/forward)
  useEffect(() => {
    setSearchText(getSearch())
  }, [pathname])

  useEffect(() => {
    const onPopState = () => setSearchText(getSearch())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Also patch pushState/replaceState to detect navigation from Next.js Link
  useEffect(() => {
    const origPush = history.pushState.bind(history)
    const origReplace = history.replaceState.bind(history)

    history.pushState = function (...args) {
      origPush(...args)
      setSearchText(getSearch())
    }
    history.replaceState = function (...args) {
      origReplace(...args)
      setSearchText(getSearch())
    }

    return () => {
      history.pushState = origPush
      history.replaceState = origReplace
    }
  }, [])

  const current = useMemo(() => new URLSearchParams(searchText), [searchText])

  const setSearchParams = (nextValue) => {
    let nextParams
    if (nextValue instanceof URLSearchParams) {
      nextParams = new URLSearchParams(nextValue)
    } else if (typeof nextValue === 'string') {
      nextParams = new URLSearchParams(nextValue)
    } else if (nextValue && typeof nextValue === 'object') {
      nextParams = new URLSearchParams()
      Object.entries(nextValue).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          nextParams.set(key, String(value))
        }
      })
    } else {
      nextParams = new URLSearchParams()
    }

    const query = nextParams.toString()
    const nextUrl = query ? `${pathname}?${query}` : pathname
    router.push(nextUrl)
  }

  return [current, setSearchParams]
}

export function Navigate({ to, replace }) {
  const router = useRouter()

  useEffect(() => {
    if (replace) router.replace(to)
    else router.push(to)
  }, [router, to, replace])

  return null
}

export function Route() {
  return null
}

export function Routes({ children }) {
  const pathname = usePathname() || '/'
  const routeDefs = React.Children.toArray(children)
    .filter((child) => React.isValidElement(child))
    .map((child) => child.props)

  let matched = routeDefs.find((route) => {
    if (!route.path || route.index) return false
    if (route.path.startsWith('/')) return pathname === route.path
    return pathname.endsWith(`/${route.path}`)
  })

  if (!matched) {
    matched = routeDefs.find((route) => route.index)
  }

  return matched?.element || null
}
