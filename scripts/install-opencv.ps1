# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host @"
Please run this script as Administrator. Here's how:

1. Open PowerShell as Administrator:
   - Right-click on PowerShell
   - Select 'Run as Administrator'

2. Navigate to the script directory:
   cd $PSScriptRoot

3. Run the script:
   .\install-opencv.ps1

"@ -ForegroundColor Yellow
    exit 1
}

Write-Host "Installing OpenCV 4.9.0 and dependencies..." -ForegroundColor Green

# Install Chocolatey if not already installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey..." -ForegroundColor Cyan
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
}

# Install required packages
Write-Host "Installing required packages..." -ForegroundColor Cyan
choco install -y cmake mingw

# Download and extract OpenCV 4.9.0
Write-Host "Downloading OpenCV 4.9.0..." -ForegroundColor Cyan
$opencvVersion = "4.9.0"
$downloadUrl = "https://github.com/opencv/opencv/archive/$opencvVersion.zip"
$downloadPath = "$env:TEMP\opencv-$opencvVersion.zip"
$extractPath = "C:\tools"

# Create tools directory if it doesn't exist
if (-not (Test-Path $extractPath)) {
    New-Item -ItemType Directory -Path $extractPath | Out-Null
}

# Download OpenCV
Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath

# Extract OpenCV
Write-Host "Extracting OpenCV..." -ForegroundColor Cyan
Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
Rename-Item -Path "$extractPath\opencv-$opencvVersion" -NewName "opencv" -Force

# Build OpenCV
Write-Host "Building OpenCV..." -ForegroundColor Cyan
$buildPath = "C:\tools\opencv\build"
if (-not (Test-Path $buildPath)) {
    New-Item -ItemType Directory -Path $buildPath | Out-Null
}

Set-Location $buildPath

# Configure CMake
cmake -G "MinGW Makefiles" `
    -D CMAKE_BUILD_TYPE=RELEASE `
    -D CMAKE_INSTALL_PREFIX=C:/tools/opencv/build `
    -D OPENCV_GENERATE_PKGCONFIG=ON `
    -D BUILD_SHARED_LIBS=ON `
    -D WITH_IPP=OFF `
    -D WITH_TBB=OFF `
    -D WITH_OPENMP=OFF `
    -D WITH_CSTRIPES=OFF `
    -D WITH_OPENCL=OFF `
    -D BUILD_TESTS=OFF `
    -D BUILD_PERF_TESTS=OFF `
    -D BUILD_EXAMPLES=OFF `
    -D WITH_QT=OFF `
    -D WITH_GTK=OFF `
    -D WITH_CUDA=OFF `
    ..

# Build
mingw32-make -j8
mingw32-make install

# Set up environment variables
Write-Host "Setting up environment variables..." -ForegroundColor Cyan

# Add OpenCV to PATH
$opencvPath = "C:\tools\opencv\build\bin"
$mingwPath = "C:\ProgramData\chocolatey\lib\mingw\tools\install\mingw64\bin"

$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if (-not $currentPath.Contains($opencvPath)) {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$opencvPath", "Machine")
}
if (-not $currentPath.Contains($mingwPath)) {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$mingwPath", "Machine")
}

# Set CGO environment variables
[Environment]::SetEnvironmentVariable("CGO_CPPFLAGS", "-IC:/tools/opencv/build/include", "Machine")
[Environment]::SetEnvironmentVariable("CGO_LDFLAGS", "-LC:/tools/opencv/build/bin -lopencv_world480", "Machine")

Write-Host @"

OpenCV 4.9.0 installation completed successfully!

Please restart your terminal to apply the environment variable changes.
Then run the GoCV installation script:
.\install-gocv.ps1

"@ -ForegroundColor Green 