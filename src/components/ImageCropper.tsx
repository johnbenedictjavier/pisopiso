import { useEffect, useRef, useState } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import Modal from './Modal'
import { blobToDataUrl } from '../lib/images'

interface ImageCropperProps {
  open: boolean
  imageUrl: string | null
  title: string
  description: string
  shape?: 'square' | 'circle'
  onClose: () => void
  onConfirm: (imageUrl: string) => void
}

interface Offset {
  x: number
  y: number
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export default function ImageCropper({ open, imageUrl, title, description, shape = 'square', onClose, onConfirm }: ImageCropperProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; offset: Offset } | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !imageUrl) {
      setImage(null)
      return
    }
    const nextImage = new Image()
    nextImage.onload = () => {
      setImage(nextImage)
      setZoom(MIN_ZOOM)
      setOffset({ x: 0, y: 0 })
    }
    nextImage.src = imageUrl
  }, [imageUrl, open])

  function getStageSize(): number {
    return stageRef.current?.clientWidth ?? 320
  }

  function clampOffset(nextOffset: Offset, nextZoom = zoom): Offset {
    if (!image) return nextOffset
    const stageSize = getStageSize()
    const scale = Math.max(stageSize / image.naturalWidth, stageSize / image.naturalHeight) * nextZoom
    const maxX = Math.max(0, (image.naturalWidth * scale - stageSize) / 2)
    const maxY = Math.max(0, (image.naturalHeight * scale - stageSize) / 2)
    return { x: clamp(nextOffset.x, -maxX, maxX), y: clamp(nextOffset.y, -maxY, maxY) }
  }

  function updateZoom(nextZoom: number): void {
    const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
    setZoom(clampedZoom)
    setOffset((current) => clampOffset(current, clampedZoom))
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    if (!image || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, offset }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>): void {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setOffset(clampOffset({ x: drag.offset.x + event.clientX - drag.startX, y: drag.offset.y + event.clientY - drag.startY }))
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>): void {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>): void {
    event.preventDefault()
    updateZoom(zoom + (event.deltaY < 0 ? 0.12 : -0.12))
  }

  function confirmCrop(): void {
    if (!image || saving) return
    const stageSize = getStageSize()
    const scale = Math.max(stageSize / image.naturalWidth, stageSize / image.naturalHeight) * zoom
    const sourceSize = stageSize / scale
    const sourceX = clamp(image.naturalWidth / 2 - offset.x / scale - sourceSize / 2, 0, image.naturalWidth - sourceSize)
    const sourceY = clamp(image.naturalHeight / 2 - offset.y / scale - sourceSize / 2, 0, image.naturalHeight - sourceSize)
    const canvas = document.createElement('canvas')
    canvas.width = 700
    canvas.height = 700
    const context = canvas.getContext('2d')
    if (!context) return
    setSaving(true)
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) {
        setSaving(false)
        return
      }
      void blobToDataUrl(blob).then((dataUrl) => {
        onConfirm(dataUrl)
        setSaving(false)
      })
    }, 'image/webp', 0.86)
  }

  const stageSize = getStageSize()
  const imageScale = image ? Math.max(stageSize / image.naturalWidth, stageSize / image.naturalHeight) * zoom : 1

  return (
    <Modal open={open} title={title} description={description} onClose={onClose} size="medium">
      <div className="image-cropper">
        <div ref={stageRef} className={`image-crop-stage image-crop-stage-${shape}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onWheel={handleWheel}>
          {image && <img src={image.src} alt="Crop preview" draggable={false} style={{ width: image.naturalWidth * imageScale, height: image.naturalHeight * imageScale, transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))` }} />}
          <span className="image-crop-guide" aria-hidden="true" />
        </div>
        <p className="image-crop-help">Drag the image to reposition it. Use pinch, scroll, or the buttons to zoom.</p>
        <div className="image-crop-controls" aria-label="Crop zoom controls">
          <button className="icon-button" type="button" aria-label="Zoom out" title="Zoom out" onClick={() => updateZoom(zoom - 0.12)} disabled={zoom <= MIN_ZOOM}><Minus size={17} /></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button className="icon-button" type="button" aria-label="Zoom in" title="Zoom in" onClick={() => updateZoom(zoom + 0.12)} disabled={zoom >= MAX_ZOOM}><Plus size={17} /></button>
        </div>
        <div className="modal-actions">
          <button className="button button-quiet" type="button" onClick={onClose}>Cancel</button>
          <button className="button button-primary" type="button" onClick={confirmCrop} disabled={!image || saving}><Check size={16} /> {saving ? 'Applying crop' : 'Use crop'}</button>
        </div>
      </div>
    </Modal>
  )
}
