interface ImageCaptureOptions {
  imageWidth?: number
  imageHeight?: number
}

declare class ImageCapture {
  constructor(videoTrack: MediaStreamTrack)
  takePhoto(options?: ImageCaptureOptions): Promise<Blob>
  getPhotoCapabilities(): Promise<PhotoCapabilities>
  getPhotoSettings(): Promise<PhotoSettings>
  grabFrame(): Promise<ImageBitmap>
}

interface PhotoCapabilities {
  redEyeReduction: string
  imageHeight: MediaSettingsRange
  imageWidth: MediaSettingsRange
  fillLightMode: string[]
}

interface PhotoSettings {
  imageHeight: number
  imageWidth: number
  fillLightMode: string
  redEyeReduction: boolean
}
