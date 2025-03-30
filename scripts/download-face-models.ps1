# Enable verbose output
$VerbosePreference = "Continue"
$ErrorActionPreference = "Continue"

Write-Verbose "Script started"

# Create models directory if it doesn't exist
$modelsDir = "public/models"
New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null

Write-Host "Models directory created/verified at: $modelsDir"

# Define model URLs and filenames
$models = @(
    @{
        url = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"
        file = "haarcascade_frontalface_default.xml"
    },
    @{
        url = "https://raw.githubusercontent.com/ShiqiYu/libfacedetection/master/models/yunet.onnx"
        file = "face_detection_yunet.onnx"
    },
    @{
        url = "https://raw.githubusercontent.com/ShiqiYu/libfacedetection/master/models/yunet_n_640_640.onnx"
        file = "face_detection_yunet_n.onnx"
    },
    @{
        url = "https://raw.githubusercontent.com/opencv/opencv_zoo/master/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
        file = "face_detection_yunet_2023mar.onnx"
    },
    @{
        url = "https://raw.githubusercontent.com/opencv/opencv_zoo/master/models/face_detection_yunet/face_detection_yunet_2023mar_int8.onnx"
        file = "face_detection_yunet_2023mar_int8.onnx"
    }
)

# Download each model
foreach ($model in $models) {
    $outFile = Join-Path $modelsDir $model.file
    Write-Host "Downloading $($model.file)..."
    
    try {
        Invoke-WebRequest -Uri $model.url -OutFile $outFile
        Write-Host "Successfully downloaded $($model.file)"
    }
    catch {
        Write-Host "Failed to download $($model.file): $_"
    }
}

Write-Host "Model download complete!"
Write-Verbose "Script completed" 