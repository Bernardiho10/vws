# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "Installing GoCV..." -ForegroundColor Green

# Verify OpenCV installation
$opencvPath = "C:\tools\opencv\build\bin"
if (-not (Test-Path $opencvPath)) {
    Write-Host @"
OpenCV installation not found!

Please run the OpenCV installation script first:
.\install-opencv.ps1

"@ -ForegroundColor Red
    exit 1
}

# Verify environment variables
$requiredEnvVars = @(
    @{Name = "CGO_CPPFLAGS"; Expected = "-IC:/tools/opencv/build/include"},
    @{Name = "CGO_LDFLAGS"; Expected = "-LC:/tools/opencv/build/bin -lopencv_world490"}
)

$missingEnvVars = $false
foreach ($var in $requiredEnvVars) {
    $value = [Environment]::GetEnvironmentVariable($var.Name, "Machine")
    if ($value -ne $var.Expected) {
        Write-Host "Missing or incorrect environment variable: $($var.Name)" -ForegroundColor Red
        Write-Host "Expected: $($var.Expected)" -ForegroundColor Yellow
        Write-Host "Actual: $value" -ForegroundColor Yellow
        $missingEnvVars = $true
    }
}

if ($missingEnvVars) {
    Write-Host @"

Please run the OpenCV installation script first:
.\install-opencv.ps1

"@ -ForegroundColor Red
    exit 1
}

try {
    # Clean up any existing GoCV installation
    Write-Host "Cleaning up existing installations..." -ForegroundColor Cyan
    go clean -cache
    go clean -modcache

    # Set up build environment
    Write-Host "Setting up build environment..." -ForegroundColor Cyan
    $Env:CGO_CXXFLAGS = "--std=c++11"
    $Env:CGO_CPPFLAGS = "-IC:/tools/opencv/build/include"
    $Env:CGO_LDFLAGS = "-LC:/tools/opencv/build/bin -lopencv_world490"

    # Get and install GoCV
    Write-Host "Installing GoCV v0.35.0..." -ForegroundColor Cyan
    go install gocv.io/x/gocv@v0.35.0

    Write-Host @"

GoCV v0.35.0 installation completed successfully!

You can now build and run your Go application with OpenCV support.
To verify the installation, try running the tests:
cd backend
go test ./...

"@ -ForegroundColor Green

} catch {
    Write-Host @"

Error installing GoCV:
$($_.Exception.Message)

Please ensure that:
1. Go is installed and in your PATH
2. OpenCV 4.9.0 is installed correctly
3. You have an active internet connection
4. All environment variables are set correctly

Current environment variables:
CGO_CXXFLAGS: $Env:CGO_CXXFLAGS
CGO_CPPFLAGS: $Env:CGO_CPPFLAGS
CGO_LDFLAGS: $Env:CGO_LDFLAGS

"@ -ForegroundColor Red
    exit 1
} 