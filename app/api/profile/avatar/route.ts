import { NextRequest } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import { badRequest, internalServerError, ok, unauthorized } from '@/lib/utils/apiResponse'
import { validateUploadedImageFile } from '@/lib/uploadedImageValidation'

const PROFILE_IMAGE_BUCKET = 'ProfileIMG'
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])
const ALLOWED_IMAGE_FORMAT_LABEL = 'JPEG, PNG, WebP, GIF, AVIF'
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60
const SIGNED_URL_CACHE_TTL_MS = 5 * 60 * 1000

type SignedUrlCacheEntry = {
  url: string
  expiresAt: number
}

const signedAvatarUrlCache = new Map<string, SignedUrlCacheEntry>()

function getFileExtension(file: File) {
  const fromName = (file.name.split('.').pop() || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  if (fromName) return fromName

  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  if (file.type === 'image/avif') return 'avif'
  return 'jpg'
}

async function createSignedAvatarUrl(adminClient: Awaited<ReturnType<typeof createAdminClient>>, path: string) {
  const cacheKey = path.trim()
  const cached = signedAvatarUrlCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url
  }

  const { data, error } = await adminClient.storage
    .from(PROFILE_IMAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_IN_SECONDS)

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Failed to sign profile image URL.')
  }

  const signedUrl = data.signedUrl
  signedAvatarUrlCache.set(cacheKey, {
    url: signedUrl,
    expiresAt: Date.now() + SIGNED_URL_CACHE_TTL_MS,
  })

  return signedUrl
}

async function getLatestAvatarPath(adminClient: Awaited<ReturnType<typeof createAdminClient>>, userId: string): Promise<string | null> {
  const { data: files, error } = await adminClient.storage
    .from(PROFILE_IMAGE_BUCKET)
    .list(userId, {
      limit: 20,
      sortBy: { column: 'created_at', order: 'desc' },
    })

  if (error || !files?.length) {
    return null
  }

  const imageFile = files.find((file) => {
    const lower = file.name.toLowerCase()
    return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp') || lower.endsWith('.gif') || lower.endsWith('.avif')
  })

  if (!imageFile) {
    return null
  }

  return `${userId}/${imageFile.name}`
}

async function listUserAvatarPaths(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string
): Promise<string[]> {
  const { data: files, error } = await adminClient.storage
    .from(PROFILE_IMAGE_BUCKET)
    .list(userId, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    })

  if (error || !files?.length) {
    return []
  }

  return files
    .map((file) => file.name?.trim())
    .filter((name): name is string => Boolean(name))
    .map((name) => `${userId}/${name}`)
}

export async function GET(request: NextRequest) {
  try {
    const sessionClient = await createClient()
    const {
      data: { user },
      error: authError,
    } = await sessionClient.auth.getUser()

    if (authError || !user) {
      return unauthorized('Unauthorized')
    }

    const adminClient = await createAdminClient()
    const queryPath = request.nextUrl.searchParams.get('path')?.trim() || ''
    const metadata = (user.user_metadata || {}) as Record<string, unknown>
    const metadataPath = typeof metadata.profile_image_path === 'string' ? metadata.profile_image_path.trim() : ''
    const avatarMarker = typeof metadata.avatar_url === 'string' ? metadata.avatar_url.trim() : ''
    const markerPath = avatarMarker.startsWith('storage:') ? avatarMarker.slice('storage:'.length).trim() : ''

    let filePath = queryPath || metadataPath || markerPath

    if (!filePath) {
      filePath = (await getLatestAvatarPath(adminClient, user.id)) || ''
    }

    if (!filePath) {
      const response = ok({ avatarUrl: null, filePath: null })
      response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300')
      return response
    }

    const avatarUrl = await createSignedAvatarUrl(adminClient, filePath)
    const response = ok({ avatarUrl, filePath })
    if (queryPath) {
      response.headers.set('Cache-Control', 'private, max-age=600, stale-while-revalidate=3600')
    } else {
      response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300')
    }
    return response
  } catch (error) {
    console.error('Profile avatar fetch API error:', error)
    return internalServerError('Failed to load profile image.')
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionClient = await createClient()
    const {
      data: { user },
      error: authError,
    } = await sessionClient.auth.getUser()

    if (authError || !user) {
      return unauthorized('Unauthorized')
    }

    const formData = await request.formData()
    const image = formData.get('image')

    if (!(image instanceof File)) {
      return badRequest('Image file is required.')
    }

    const imageValidationError = await validateUploadedImageFile(image, {
      allowedMimeTypes: ALLOWED_IMAGE_TYPES,
      allowedFormatsLabel: ALLOWED_IMAGE_FORMAT_LABEL,
      maxBytes: MAX_UPLOAD_SIZE_BYTES,
    })
    if (imageValidationError) {
      return badRequest(imageValidationError)
    }

    const extension = getFileExtension(image)
    const filePath = `${user.id}/avatar-${Date.now()}.${extension}`

    const adminClient = await createAdminClient()
    const previousAvatarPaths = await listUserAvatarPaths(adminClient, user.id)

    const { error: uploadError } = await adminClient.storage
      .from(PROFILE_IMAGE_BUCKET)
      .upload(filePath, image, {
        cacheControl: '3600',
        upsert: false,
        contentType: image.type,
      })

    if (uploadError) {
      return internalServerError(uploadError.message || 'Failed to upload avatar image.')
    }

    const avatarUrl = await createSignedAvatarUrl(adminClient, filePath)
    signedAvatarUrlCache.set(filePath, {
      url: avatarUrl,
      expiresAt: Date.now() + SIGNED_URL_CACHE_TTL_MS,
    })

    const { error: updateUserError } = await sessionClient.auth.updateUser({
      data: {
        avatar_url: `storage:${filePath}`,
        profile_image_path: filePath,
      },
    })

    if (updateUserError) {
      return internalServerError(updateUserError.message || 'Failed to update profile image metadata.')
    }

    const pathsToDelete = previousAvatarPaths.filter((path) => path !== filePath)
    if (pathsToDelete.length > 0) {
      await adminClient.storage.from(PROFILE_IMAGE_BUCKET).remove(pathsToDelete)
      pathsToDelete.forEach((path) => {
        signedAvatarUrlCache.delete(path)
      })
    }

    return ok({ avatarUrl, filePath })
  } catch (error) {
    console.error('Profile avatar upload API error:', error)
    return internalServerError('Failed to upload profile image.')
  }
}
