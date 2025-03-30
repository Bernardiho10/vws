package face

import (
	"context"
	"image"
	"image/color"
	"testing"
)

func TestNewService(t *testing.T) {
	tests := []struct {
		name      string
		modelPath string
		wantErr   bool
	}{
		{
			name:      "Valid model path",
			modelPath: "testdata/yunet.onnx",
			wantErr:   false,
		},
		{
			name:      "Empty model path",
			modelPath: "",
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, err := NewService(tt.modelPath)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewService() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if err == nil && svc == nil {
				t.Error("NewService() returned nil service")
			}
		})
	}
}

func TestService_DetectFace(t *testing.T) {
	svc, err := NewService("testdata/yunet.onnx")
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	tests := []struct {
		name    string
		img     image.Image
		want    int // Expected number of faces
		wantErr bool
	}{
		{
			name:    "Valid image with face",
			img:     createTestImage(320, 320, true), // Image with a face
			want:    1,
			wantErr: false,
		},
		{
			name:    "Valid image without face",
			img:     createTestImage(320, 320, false), // Image without a face
			want:    0,
			wantErr: false,
		},
		{
			name:    "Small image",
			img:     createTestImage(32, 32, true),
			want:    0,
			wantErr: false,
		},
		{
			name:    "Nil image",
			img:     nil,
			want:    0,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := svc.DetectFace(context.Background(), tt.img)
			if (err != nil) != tt.wantErr {
				t.Errorf("DetectFace() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && len(result.Faces) != tt.want {
				t.Errorf("DetectFace() got %v faces, want %v", len(result.Faces), tt.want)
			}
		})
	}
}

func TestService_Close(t *testing.T) {
	svc, err := NewService("testdata/yunet.onnx")
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	if err := svc.Close(); err != nil {
		t.Errorf("Close() error = %v", err)
	}
}

// Helper function to create a test image
func createTestImage(width, height int, withFace bool) image.Image {
	img := image.NewRGBA(image.Rect(0, 0, width, height))

	// Fill background with white
	for x := 0; x < width; x++ {
		for y := 0; y < height; y++ {
			img.Set(x, y, color.White)
		}
	}

	if withFace {
		// Draw a simple face-like pattern with skin color
		centerX := width / 2
		centerY := height / 2
		faceSize := width / 4

		// Draw face outline with skin color
		skinColor := color.RGBA{R: 255, G: 200, B: 150, A: 255}
		drawCircle(img, centerX, centerY, faceSize, skinColor)

		// Draw features in darker color
		featureColor := color.RGBA{R: 100, G: 80, B: 60, A: 255}
		eyeSize := faceSize / 4
		drawCircle(img, centerX-faceSize/3, centerY-faceSize/4, eyeSize, featureColor)
		drawCircle(img, centerX+faceSize/3, centerY-faceSize/4, eyeSize, featureColor)
		drawArc(img, centerX, centerY+faceSize/3, faceSize/2, faceSize/4, featureColor)
	}

	return img
}

// Helper function to draw a circle
func drawCircle(img *image.RGBA, centerX, centerY, radius int, c color.Color) {
	for x := -radius; x <= radius; x++ {
		for y := -radius; y <= radius; y++ {
			if x*x+y*y <= radius*radius {
				img.Set(centerX+x, centerY+y, c)
			}
		}
	}
}

// Helper function to draw an arc (simple smile)
func drawArc(img *image.RGBA, centerX, centerY, width, height int, c color.Color) {
	for x := -width; x <= width; x++ {
		y := height * x * x / (width * width)
		img.Set(centerX+x, centerY+y, c)
	}
}
