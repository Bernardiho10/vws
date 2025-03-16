'use client'

import { useState, useEffect } from 'react'

/**
 * Result of the safe blockchain initialization
 */
interface SafeBlockchainResult {
  readonly isReady: boolean
}

/**
 * Custom hook to safely initialize blockchain functionality
 * only on the client side after hydration is complete
 */
export function useSafeBlockchain(): SafeBlockchainResult {
  const [isReady, setIsReady] = useState<boolean>(false)
  
  useEffect(() => {
    // Only initialize blockchain after client-side hydration
    setIsReady(true)
    
    return () => {
      setIsReady(false)
    }
  }, [])
  
  return { isReady }
}
