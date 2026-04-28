/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"

jest.mock("$repositories/AnnouncementRepository", () => {
	const mockCreate = jest.fn<any>()
	const mockGetAll = jest.fn<any>()
	const mockGetById = jest.fn<any>()
	const mockUpdate = jest.fn<any>()
	const mockDeleteById = jest.fn<any>()
	return { create: mockCreate, getAll: mockGetAll, getById: mockGetById, update: mockUpdate, deleteById: mockDeleteById }
})

jest.mock("$services/UserActivityLogService", () => ({ create: jest.fn<any>() }))

jest.mock("$pkg/logger", () => ({ info: jest.fn<any>(), error: jest.fn<any>() }))

import { create, getAll, getById, update, deleteById } from "$services/AnnouncementService"

describe("AnnouncementService", () => {
	beforeEach(() => { jest.clearAllMocks() })

	describe("create", () => {
		it("should create announcement successfully", async () => {
			const mocks = jest.requireMock("$repositories/AnnouncementRepository") as any
			const logMock = jest.requireMock("$services/UserActivityLogService") as any
			mocks.create.mockResolvedValue({ id: "announce-123", title: "Test Announcement" })
			const result = await create({ title: "Test Announcement", content: "Content" } as any, "user-123", "tenant-123")
			expect(result.status).toBe(true)
			expect(mocks.create).toHaveBeenCalled()
			expect(logMock.create).toHaveBeenCalled()
		})
	})

	describe("getAll", () => {
		it("should return paginated announcements", async () => {
			const mocks = jest.requireMock("$repositories/AnnouncementRepository") as any
			mocks.getAll.mockResolvedValue({ data: [{ id: "announce-1" }], total: 1 })
			const result = await getAll({} as any, { id: "user-123" } as any, "tenant-123")
			expect(result.status).toBe(true)
		})
	})

	describe("getById", () => {
		it("should return announcement when found", async () => {
			const mocks = jest.requireMock("$repositories/AnnouncementRepository") as any
			mocks.getById.mockResolvedValue({ id: "announce-123", title: "Test Announcement" })
			const result = await getById("announce-123")
			expect(result.status).toBe(true)
		})

		it("should return error when announcement not found", async () => {
			const mocks = jest.requireMock("$repositories/AnnouncementRepository") as any
			mocks.getById.mockResolvedValue(null)
			const result = await getById("nonexistent")
			expect(result.status).toBe(false)
		})
	})

	describe("update", () => {
		it("should update announcement successfully", async () => {
			const mocks = jest.requireMock("$repositories/AnnouncementRepository") as any
			mocks.getById.mockResolvedValue({ id: "announce-123", title: "Old Title" })
			mocks.update.mockResolvedValue({ id: "announce-123", title: "New Title" })
			const result = await update("announce-123", { title: "New Title" } as any, "tenant-123", "user-123")
			expect(result.status).toBe(true)
		})

		it("should return error when announcement not found", async () => {
			const mocks = jest.requireMock("$repositories/AnnouncementRepository") as any
			mocks.getById.mockResolvedValue(null)
			const result = await update("nonexistent", { title: "New Title" } as any, "tenant-123", "user-123")
			expect(result.status).toBe(false)
		})
	})

	describe("deleteById", () => {
		it("should delete announcement successfully", async () => {
			const mocks = jest.requireMock("$repositories/AnnouncementRepository") as any
			mocks.getById.mockResolvedValue({ id: "announce-123", title: "Test" })
			mocks.deleteById.mockResolvedValue(undefined)
			const result = await deleteById("announce-123", "tenant-123", "user-123")
			expect(result.status).toBe(true)
			expect(mocks.deleteById).toHaveBeenCalled()
		})

		it("should return error when announcement not found", async () => {
			const mocks = jest.requireMock("$repositories/AnnouncementRepository") as any
			mocks.getById.mockResolvedValue(null)
			const result = await deleteById("nonexistent", "tenant-123", "user-123")
			expect(result.status).toBe(false)
		})
	})
})
