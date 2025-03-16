"use client"

import React from "react"
import { SharePageContent } from "@/components/share-page-content"
import { Providers } from "@/components/providers/providers"

/**
 * Client-side wrapper for the share page
 */
export function ShareClient(): React.ReactElement {
  return (
    <Providers>
      <SharePageContent />
    </Providers>
  )
}
