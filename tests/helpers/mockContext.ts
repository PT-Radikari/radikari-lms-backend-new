/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Context } from "hono"

export interface MockContextOptions {
	params?: Record<string, string>
	query?: Record<string, string>
	body?: unknown
	headers?: Record<string, string>
	jwtPayload?: unknown
	tenantId?: string
	user?: unknown
}

export function createMockContext(
	options: MockContextOptions = {},
): {
	mock: Context
	spy: {
		status: jest.Mock
		json: jest.Mock
	}
} {
	const statusSpy = jest.fn()
	const jsonSpy = jest.fn()
	const storage = new Map<string, unknown>()

	const ctx: any = {
		req: {
			param: (key?: string) =>
				key ? options.params?.[key] : (options.params ?? {}),
			query: (key?: string) =>
				key ? options.query?.[key] : (options.query ?? {}),
			json: jest.fn().mockResolvedValue(options.body ?? {}),
			header: (name?: string) =>
				name ? options.headers?.[name] : undefined,
			parseBody: jest.fn().mockResolvedValue(options.body ?? {}),
			raw: jest.fn(),
		},
		get: (key: string) => {
			if (key === "jwtPayload") return options.jwtPayload ?? storage.get("jwtPayload")
			if (key === "tenantId") return options.tenantId
			if (key === "user") return options.user
			return storage.get(key)
		},
		set: (key: string, value: unknown) => {
			storage.set(key, value)
		},
		status: (code: number) => {
			statusSpy(code)
			return ctx
		},
		json: (data: unknown, status?: number) => {
			jsonSpy(data, status)
			if (status !== undefined) statusSpy(status)
			return ctx
		},
		header: (name: string, value?: string) => {
			if (value === undefined) return options.headers?.[name]
			return ctx
		},
		text: (data: string) => {
			return ctx
		},
		html: (data: string) => {
			return ctx
		},
		body: (data: BodyInit, status?: number) => {
			return ctx
		},
	}

	return { mock: ctx, spy: { status: statusSpy, json: jsonSpy } }
}
