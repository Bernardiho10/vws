import { BORDER_STYLE, BACKGROUND_COLOR } from "./canvas-constants"

interface DrawBackgroundOptions {
  readonly ctx: CanvasRenderingContext2D
  readonly width: number
  readonly height: number
}

interface DrawLogoOptions {
  readonly ctx: CanvasRenderingContext2D
}

interface DrawCircularImageOptions {
  readonly ctx: CanvasRenderingContext2D
  readonly image: HTMLImageElement
  readonly centerX: number
  readonly centerY: number
  readonly radius: number
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export const drawBackground = ({ ctx, width, height }: DrawBackgroundOptions): void => {
  if (!ctx) return
  ctx.fillStyle = BACKGROUND_COLOR
  ctx.fillRect(0, 0, width, height)
}

export const drawLogo = ({ ctx }: DrawLogoOptions): void => {
  if (!ctx) return
  // Logo drawing will be implemented when needed
  // This is a placeholder for future logo implementation
}

export const drawCircularImage = ({
  ctx,
  image,
  centerX,
  centerY,
  radius,
  x,
  y,
  width,
  height
}: DrawCircularImageOptions): void => {
  if (!ctx || !image) return
  // Create circular clipping path
  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true)
  ctx.closePath()
  ctx.clip()

  // Draw the image
  ctx.drawImage(image, x, y, width, height)
  ctx.restore()

  // Draw circle border
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true)
  ctx.strokeStyle = BORDER_STYLE.strokeColor
  ctx.lineWidth = BORDER_STYLE.lineWidth
  ctx.stroke()
}
