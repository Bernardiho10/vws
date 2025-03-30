import * as faceapi from 'face-api.js'

let modelsLoaded = false

const FACE_DETECTOR_OPTIONS = {
  inputSize: 224, // Standard input size for most face detection models
  scoreThreshold: 0.5
}

export async function loadModels() {
  if (modelsLoaded) return

  try {
    console.log('Loading face detection models...')
    
    // Configure models before loading
    faceapi.env.monkeyPatch({
      Canvas: HTMLCanvasElement,
      Image: HTMLImageElement,
      ImageData: ImageData,
      Video: HTMLVideoElement,
      createCanvasElement: () => document.createElement('canvas'),
      createImageElement: () => document.createElement('img')
    })

    // Load models with specific configurations
    await Promise.all([
      faceapi.nets.tinyFaceDetector.load('/models').then(() => {
        console.log('TinyFaceDetector model loaded')
      }),
      faceapi.nets.faceLandmark68Net.load('/models').then(() => {
        console.log('FaceLandmark68 model loaded')
      }),
      faceapi.nets.faceRecognitionNet.load('/models').then(() => {
        console.log('FaceRecognition model loaded')
      }),
      faceapi.nets.faceExpressionNet.load('/models').then(() => {
        console.log('FaceExpression model loaded')
      }),
      faceapi.nets.ageGenderNet.load('/models').then(() => {
        console.log('AgeGender model loaded')
      })
    ])

    modelsLoaded = true
    console.log('All face detection models loaded successfully')
  } catch (error: unknown) {
    console.error('Error loading face detection models:', error)
    modelsLoaded = false
    throw new Error(`Failed to load face detection models: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export interface FaceDetectionResult {
  faceDetected: boolean
  confidence: number
  age?: number
  gender?: string
  genderProbability?: number
  expressions?: faceapi.FaceExpressions
  landmarks?: faceapi.FaceLandmarks68
}

async function ensureImageLoaded(imageElement: HTMLImageElement | HTMLVideoElement): Promise<void> {
  if (imageElement instanceof HTMLImageElement && !imageElement.complete) {
    return new Promise((resolve, reject) => {
      imageElement.onload = () => resolve()
      imageElement.onerror = (error) => reject(error)
    })
  }
  
  if (imageElement instanceof HTMLVideoElement && imageElement.readyState < 2) {
    return new Promise((resolve, reject) => {
      imageElement.onloadeddata = () => resolve()
      imageElement.onerror = (error) => reject(error)
    })
  }
}

export async function detectFace(imageElement: HTMLImageElement | HTMLVideoElement): Promise<FaceDetectionResult> {
  try {
    await loadModels()
    await ensureImageLoaded(imageElement)

    // Get dimensions
    const width = imageElement instanceof HTMLVideoElement ? imageElement.videoWidth : imageElement.width
    const height = imageElement instanceof HTMLVideoElement ? imageElement.videoHeight : imageElement.height

    if (!width || !height) {
      throw new Error('Image or video has invalid dimensions')
    }

    // Create a canvas element for processing
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas context')

    // Draw the image/video onto the canvas
    ctx.drawImage(imageElement, 0, 0, width, height)

    // Detect faces with all features using specific options
    const detections = await faceapi
      .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions(FACE_DETECTOR_OPTIONS))
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender()

    if (!detections.length) {
      return {
        faceDetected: false,
        confidence: 0,
      }
    }

    // Get the detection with highest confidence
    const bestDetection = detections.reduce((prev, current) => {
      return prev.detection.score > current.detection.score ? prev : current
    })

    return {
      faceDetected: true,
      confidence: bestDetection.detection.score,
      age: bestDetection.age,
      gender: bestDetection.gender,
      genderProbability: bestDetection.genderProbability,
      expressions: bestDetection.expressions,
      landmarks: bestDetection.landmarks,
    }
  } catch (error: unknown) {
    console.error('Error detecting face:', error)
    throw new Error(`Face detection failed: ${error instanceof Error ? error.message : String(error)}`)
  }
} 