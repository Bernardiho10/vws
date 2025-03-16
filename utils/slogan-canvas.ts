import { createCanvasImage } from "./canvas"

interface SloganItem {
  readonly id: string
  readonly text: string
}

interface SloganPosition {
  readonly x: number
  readonly y: number
}

interface ImageState {
  readonly src: string
  readonly width: number
  readonly height: number
  readonly element: HTMLImageElement
}

interface EmojiState {
  readonly id: string
  readonly src: string
  readonly element: HTMLImageElement | null
}

interface LoadStoredDataResult {
  readonly image: ImageState | null
  readonly emoji: EmojiState | null
}

interface DrawSloganOptions {
  readonly ctx: CanvasRenderingContext2D
  readonly text: string
  readonly position: SloganPosition
  readonly canvasWidth: number
  readonly canvasHeight: number
}

interface DrawEmojiOptions {
  readonly ctx: CanvasRenderingContext2D
  readonly element: HTMLImageElement
  readonly canvasHeight: number
}

type SloganArray = readonly SloganItem[]

export const SLOGANS: SloganArray = [
  { id: "slogan1", text: "I Stand With Peter" },
  { id: "slogan2", text: "Be the change you want" },
  { id: "slogan3", text: "Vote with Sense" },
  { id: "slogan4", text: "The new Nigeria" },
  { id: "slogan5", text: "For a better tomorrow" },
] as const

export const SLOGAN_STYLE = {
  font: "bold 24px sans-serif",
  color: "#000000",
  shadowColor: "#ffffff",
  shadowBlur: 4,
  padding: 20,
  maxWidth: 0.8 // 80% of canvas width
} as const

export const EMOJI_SIZE = {
  width: 50,
  height: 50
} as const

export const STORAGE_KEYS = {
  croppedImage: "croppedImage",
  selectedEmoji: "selectedEmoji",
  selectedSlogan: "selectedSlogan",
  sloganText: "sloganText",
  editedImage: "editedImage"
} as const

export const IMAGE_QUALITY = 0.9 as const

export const loadStoredData = async (): Promise<LoadStoredDataResult> => {
  const storedImage = localStorage.getItem(STORAGE_KEYS.croppedImage)
  const storedEmoji = localStorage.getItem(STORAGE_KEYS.selectedEmoji)
  const storedEmojiSrc = storedEmoji ? `/emojis/${storedEmoji}.svg` : null
  
  if (!storedImage) {
    return { image: null, emoji: null }
  }

  const img = await createCanvasImage({ src: storedImage })
  const image: ImageState = {
    src: storedImage,
    width: img.naturalWidth,
    height: img.naturalHeight,
    element: img
  }

  if (!storedEmoji || !storedEmojiSrc) {
    return { image, emoji: null }
  }

  try {
    const emojiImg = await createCanvasImage({ src: storedEmojiSrc })
    const emoji: EmojiState = {
      id: storedEmoji,
      src: storedEmojiSrc,
      element: emojiImg
    }
    return { image, emoji }
  } catch (error) {
    console.error("Error loading emoji:", error)
    return {
      image,
      emoji: { id: storedEmoji, src: storedEmojiSrc, element: null }
    }
  }
}

export const drawSlogan = ({ ctx, text, position, canvasWidth, canvasHeight }: DrawSloganOptions): void => {
  ctx.font = SLOGAN_STYLE.font
  ctx.fillStyle = SLOGAN_STYLE.color
  ctx.textAlign = "center"
  ctx.shadowColor = SLOGAN_STYLE.shadowColor
  ctx.shadowBlur = SLOGAN_STYLE.shadowBlur
  const x = canvasWidth * position.x
  const y = canvasHeight * position.y
  ctx.fillText(text, x, y, canvasWidth * SLOGAN_STYLE.maxWidth)
}

export const drawEmoji = ({ ctx, element, canvasHeight }: DrawEmojiOptions): void => {
  ctx.drawImage(
    element,
    SLOGAN_STYLE.padding,
    canvasHeight - EMOJI_SIZE.height - SLOGAN_STYLE.padding,
    EMOJI_SIZE.width,
    EMOJI_SIZE.height
  )
}

export type {
  SloganItem,
  SloganPosition,
  ImageState,
  EmojiState,
  LoadStoredDataResult,
  DrawSloganOptions,
  DrawEmojiOptions,
  SloganArray
}
