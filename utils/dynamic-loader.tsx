import dynamic from 'next/dynamic'
import React from 'react'
import type { DynamicOptionsLoadingProps } from 'next/dynamic'

const DefaultLoader = ({ error, isLoading, pastDelay }: DynamicOptionsLoadingProps): React.ReactElement | null => {
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px] w-full text-red-500">
        Error loading component
      </div>
    )
  }

  if (isLoading && pastDelay) {
    return (
      <div className="flex items-center justify-center min-h-[200px] w-full">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-gray-200 rounded-full" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return null
}

export interface DynamicLoaderOptions {
  loader?: (props: DynamicOptionsLoadingProps) => React.ReactElement | null
  ssr?: boolean
}

export function createDynamicComponent<Props extends Record<string, unknown>>(
  importFunc: () => Promise<{ default: React.ComponentType<Props> }>,
  options: DynamicLoaderOptions = {}
) {
  const {
    loader: LoadingComponent = DefaultLoader,
    ssr = false,
  } = options

  return dynamic(importFunc, {
    loading: LoadingComponent,
    ssr,
  })
}

// Example usage:
// const DynamicComponent = createDynamicComponent(() => import('../components/MyComponent')) 