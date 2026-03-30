import { NextResponse } from 'next/server'
import { HTTP_STATUS } from '@/lib/constants'

interface SuccessPayload<T> {
    success: true
    data: T
}

interface ErrorPayload {
    success: false
    error: string
}

export function ok<T>(data: T, status: number = HTTP_STATUS.OK) {
    return NextResponse.json<SuccessPayload<T>>({ success: true, data }, { status })
}

export function created<T>(data: T) {
    return ok(data, HTTP_STATUS.CREATED)
}

export function badRequest(error: string) {
    return NextResponse.json<ErrorPayload>({ success: false, error }, { status: HTTP_STATUS.BAD_REQUEST })
}

export function conflict(error: string) {
    return NextResponse.json<ErrorPayload>({ success: false, error }, { status: HTTP_STATUS.CONFLICT })
}

export function unauthorized(error: string = 'Unauthorized') {
    return NextResponse.json<ErrorPayload>({ success: false, error }, { status: HTTP_STATUS.UNAUTHORIZED })
}

export function internalServerError(error: string = 'Internal server error') {
    return NextResponse.json<ErrorPayload>({ success: false, error }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
}
