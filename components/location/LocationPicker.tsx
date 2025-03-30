import React, { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface LocationPickerProps {
  onSelect: (location: { latitude: number; longitude: number; address?: string }) => void
}

interface Location {
  latitude: number
  longitude: number
  address?: string
}

function LocationMarker({ onLocationUpdate }: { onLocationUpdate: (loc: Location) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null)

  useMapEvents({
    click(e: LeafletMouseEvent) {
      setPosition([e.latlng.lat, e.latlng.lng])
      onLocationUpdate({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      })
    }
  })

  return position ? <Marker position={position} /> : null
}

export function LocationPicker({ onSelect }: LocationPickerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)

  const handleGetCurrentLocation = () => {
    setIsLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const location = {
            latitude,
            longitude,
            address: data.display_name
          }
          setCurrentLocation(location)
          onSelect(location)
        } catch {
          setError('Failed to get address information')
        } finally {
          setIsLoading(false)
        }
      },
      () => {
        setError('Failed to get your location')
        setIsLoading(false)
      }
    )
  }

  const handleMapClick = (location: Location) => {
    setCurrentLocation(location)
    onSelect(location)
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGetCurrentLocation}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Getting location...
          </>
        ) : (
          'Use Current Location'
        )}
      </Button>

      {error && (
        <Card className="p-4 text-red-500 text-sm">
          {error}
        </Card>
      )}

      <div className="h-[300px] w-full rounded-lg overflow-hidden border">
        <MapContainer
          center={[51.505, -0.09]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onLocationUpdate={handleMapClick} />
          {currentLocation && (
            <Marker position={[currentLocation.latitude, currentLocation.longitude]} />
          )}
        </MapContainer>
      </div>

      {currentLocation && (
        <Card className="p-4 text-sm">
          <p>Selected location:</p>
          <p className="font-mono mt-1">
            {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </p>
          {currentLocation.address && (
            <p className="mt-1 text-muted-foreground">{currentLocation.address}</p>
          )}
        </Card>
      )}
    </div>
  )
} 