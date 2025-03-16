interface CanvasImageOptions {
  readonly src: string
}

interface CanvasDrawOptions {
  readonly ctx: CanvasRenderingContext2D
  readonly width: number
  readonly height: number
}

interface DrawTextOptions {
  readonly ctx: CanvasRenderingContext2D
  readonly text: string
  readonly x: number
  readonly y: number
  readonly font: string
  readonly color: string
}

interface DrawCircleOptions {
  readonly ctx: CanvasRenderingContext2D
  readonly x: number
  readonly y: number
  readonly radius: number
  readonly color: string
}

interface DrawImageOptions {
  readonly ctx: CanvasRenderingContext2D
  readonly image: HTMLImageElement
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

interface DrawCircularImageOptions extends DrawImageOptions {
  readonly radius: number
  readonly centerX: number
  readonly centerY: number
}

interface DrawLocationOptions {
  readonly ctx: CanvasRenderingContext2D
  readonly text: string
  readonly centerX: number
  readonly y: number
}

interface DrawSloganOptions {
  readonly ctx: CanvasRenderingContext2D
  readonly text: string
  readonly centerX: number
  readonly y: number
}

const CANVAS_SIZE = {
  width: 500,
  height: 500
} as const

const LOGO_CONFIG = {
  x: 40,
  y: 40,
  radius: 30,
  color: "#00a651"
} as const

const LOCATION_ICON_CONFIG = {
  radius: 15,
  color: "#ff6b6b",
  offsetY: 30
} as const

const TEXT_STYLES = {
  location: {
    font: "bold 18px sans-serif",
    color: "#000"
  },
  slogan: {
    font: "bold 20px sans-serif",
    color: "#000"
  }
} as const

export const createCanvasImage = ({ src }: CanvasImageOptions): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img")
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

export const drawBackground = ({ ctx, width, height }: CanvasDrawOptions): void => {
  ctx.fillStyle = "#f8f9fa"
  ctx.fillRect(0, 0, width, height)
}

export const drawCircle = ({ ctx, x, y, radius, color }: DrawCircleOptions): void => {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

export const drawLogo = ({ ctx }: Pick<CanvasDrawOptions, "ctx">): void => {
  drawCircle({
    ctx,
    x: LOGO_CONFIG.x,
    y: LOGO_CONFIG.y,
    radius: LOGO_CONFIG.radius,
    color: LOGO_CONFIG.color
  })
}

export const drawText = ({ ctx, text, x, y, font, color }: DrawTextOptions): void => {
  ctx.font = font
  ctx.textAlign = "center"
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
}

export const drawCircularImage = ({ ctx, image, centerX, centerY, radius }: DrawCircularImageOptions): void => {
  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(image, centerX - radius, centerY - radius, radius * 2, radius * 2)
  ctx.restore()
}

export const drawLocation = ({ ctx, text, centerX, y }: DrawLocationOptions): void => {
  drawText({
    ctx,
    text,
    x: centerX,
    y,
    ...TEXT_STYLES.location
  })
  drawCircle({
    ctx,
    x: centerX,
    y: y - LOCATION_ICON_CONFIG.offsetY,
    radius: LOCATION_ICON_CONFIG.radius,
    color: LOCATION_ICON_CONFIG.color
  })
}

export const drawSlogan = ({ ctx, text, centerX, y }: DrawSloganOptions): void => {
  drawText({
    ctx,
    text,
    x: centerX,
    y,
    ...TEXT_STYLES.slogan
  })
}

export const drawEmoji = ({ ctx, image, x, y, width, height }: DrawImageOptions): void => {
  ctx.drawImage(image, x, y, width, height)
}

export { CANVAS_SIZE }
