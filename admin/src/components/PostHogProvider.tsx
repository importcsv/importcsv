"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react"
import { Suspense, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useUser } from "@/hooks/useUser"

const isCloudMode = process.env.NEXT_PUBLIC_IMPORTCSV_CLOUD === "true"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog if the key is available
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!posthogKey) {
      if (process.env.NODE_ENV === "development") {
        console.log("PostHog: No API key found, skipping initialization")
      }
      return
    }

    try {
      posthog.init(posthogKey, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        capture_pageview: false,
        capture_pageleave: true,
        debug: process.env.NODE_ENV === "development",
        // Disable in development to avoid noise
        autocapture: process.env.NODE_ENV === "production",
        // Session recordings: only in production AND cloud mode
        disable_session_recording:
          process.env.NODE_ENV === "development" || !isCloudMode,
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: "[data-ph-mask]",
        },
      })
    } catch (error) {
      console.error("Failed to initialize PostHog:", error)
    }
  }, [])

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      <PostHogIdentifyWrapper />
      {children}
    </PHProvider>
  )
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      const search = searchParams.toString()
      if (search) {
        url += "?" + search
      }
      posthog.capture("$pageview", { "$current_url": url })
    }
  }, [pathname, searchParams, posthog])

  return null
}

function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  )
}

function PostHogIdentify() {
  const { user, isAuthenticated } = useUser()
  const posthog = usePostHog()

  useEffect(() => {
    if (isAuthenticated && user && posthog) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.full_name,
        created_at: user.created_at,
      })
    }
  }, [isAuthenticated, user, posthog])

  useEffect(() => {
    // Reset PostHog when user logs out
    if (!isAuthenticated && posthog) {
      posthog.reset()
    }
  }, [isAuthenticated, posthog])

  return null
}

export function PostHogIdentifyWrapper() {
  return (
    <Suspense fallback={null}>
      <PostHogIdentify />
    </Suspense>
  )
}
