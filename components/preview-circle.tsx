interface PreviewCircleProps {
  readonly children: React.ReactNode
  readonly variant?: "dashed" | "solid"
  readonly className?: string
}

const BASE_STYLES = {
  size: "w-64 h-64",
  shape: " bg-muted",
  layout: "flex items-center justify-center"
} as const

const VARIANT_STYLES = {
  dashed: "border-2 border-dashed border-primary/50",
  solid: "border-2 border-primary"
} as const

export function PreviewCircle({ children, variant = "solid", className = "" }: PreviewCircleProps) {
  const variantStyle = VARIANT_STYLES[variant]
  return (
    <div className={`${BASE_STYLES.size} ${BASE_STYLES.shape} ${BASE_STYLES.layout} ${variantStyle} ${className}`}>
      {children}
    </div>
  )
}
