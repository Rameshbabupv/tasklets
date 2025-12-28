import multer from 'multer'
import { nanoid } from 'nanoid'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads')
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename: {nanoid}-{original-name}
    const uniqueId = nanoid(10)
    const ext = path.extname(file.originalname)
    const nameWithoutExt = path.basename(file.originalname, ext)
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_')
    cb(null, `${uniqueId}-${sanitized}${ext}`)
  },
})

// File filter - accept images and videos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml',
    // Videos
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only images (JPG, PNG, GIF, SVG) and videos (MP4, WebM, MOV, AVI, WMV) are allowed.'))
  }
}

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max per file (for video support)
    files: 5, // Max 5 files
  },
})
