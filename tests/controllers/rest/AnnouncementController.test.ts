/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"

const mockAnnouncementService = {
	create: jest.fn<any>(),
	getAll: jest.fn<any>(),
	getById: jest.fn<any>(),
	update: jest.fn<any>(),
	deleteById: jest.fn<any>(),
}

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
	debug: jest.fn<any>(),
}))

jest.mock("$services/AnnouncementService", () => mockAnnouncementService)

import * as AnnouncementController from "$controllers/rest/AnnouncementController"

const mockAnnouncement = {
	id: "announcement-123",
	title: "Test Announcement",
	content: "Test content",
	tenantId: "tenant-test-123",
	createdByUserId: "user-test-123",
	createdAt: new Date(),
	updatedAt: new Date(),
}

const mockJwtPayload = {
	id: "user-test-123",
	email: "test@example.com",
	fullName: "Test User",
	role: "USER",
	type: "INTERNAL",
}

describe("AnnouncementController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("create", () => {
		it("should return 201 on successful creation", async () => {
			mockAnnouncementService.create.mockResolvedValue({
				status: true,
				data: mockAnnouncement,
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				body: { title: "Test Announcement", content: "Test content" },
				jwtPayload: mockJwtPayload,
			})

			await AnnouncementController.create(mock)

			expect(mockAnnouncementService.create).toHaveBeenCalledWith(
				{ title: "Test Announcement", content: "Test content" },
				mockJwtPayload.id,
				"tenant-test-123",
			)
			expect(spy.status).toHaveBeenCalledWith(201)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: mockAnnouncement,
				message: "Successfully created new Announcement!",
			})
		})

		it("should return error response on service failure", async () => {
			mockAnnouncementService.create.mockResolvedValue({
				status: false,
				err: { message: "Validation error", code: 400 },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				body: { title: "", content: "Test" },
				jwtPayload: mockJwtPayload,
			})

			await AnnouncementController.create(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Validation error",
			})
		})
	})

	describe("getAll", () => {
		it("should return 200 with announcement list", async () => {
			const paginatedData = {
				data: [mockAnnouncement],
				page: 1,
				limit: 10,
				total: 1,
			}
			mockAnnouncementService.getAll.mockResolvedValue({
				status: true,
				data: paginatedData,
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				query: { page: "1" },
				jwtPayload: mockJwtPayload,
			})

			await AnnouncementController.getAll(mock)

			expect(mockAnnouncementService.getAll).toHaveBeenCalled()
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: paginatedData,
				message: "Successfully fetched all Announcement!",
			})
		})

		it("should return error response on service failure", async () => {
			mockAnnouncementService.getAll.mockResolvedValue({
				status: false,
				err: { message: "Unauthorized", code: 401 },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				query: {},
				jwtPayload: mockJwtPayload,
			})

			await AnnouncementController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(401)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Unauthorized",
			})
		})
	})

	describe("getById", () => {
		it("should return 200 with announcement data", async () => {
			mockAnnouncementService.getById.mockResolvedValue({
				status: true,
				data: mockAnnouncement,
			})

			const { mock, spy } = createMockContext({
				params: { id: "announcement-123" },
			})

			await AnnouncementController.getById(mock)

			expect(mockAnnouncementService.getById).toHaveBeenCalledWith(
				"announcement-123",
			)
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: mockAnnouncement,
				message: "Successfully fetched Announcement by id!",
			})
		})

		it("should return error response on service failure", async () => {
			mockAnnouncementService.getById.mockResolvedValue({
				status: false,
				err: { message: "Announcement not found", code: 404 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent-id" },
			})

			await AnnouncementController.getById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Announcement not found",
			})
		})
	})

	describe("update", () => {
		it("should return 200 on successful update", async () => {
			const updatedAnnouncement = {
				...mockAnnouncement,
				title: "Updated Title",
			}
			mockAnnouncementService.update.mockResolvedValue({
				status: true,
				data: updatedAnnouncement,
			})

			const { mock, spy } = createMockContext({
				params: { id: "announcement-123", tenantId: "tenant-test-123" },
				body: { title: "Updated Title", content: "Updated content" },
				jwtPayload: mockJwtPayload,
			})

			await AnnouncementController.update(mock)

			expect(mockAnnouncementService.update).toHaveBeenCalledWith(
				"announcement-123",
				{ title: "Updated Title", content: "Updated content" },
				mockJwtPayload.id,
				"tenant-test-123",
			)
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: updatedAnnouncement,
				message: "Successfully updated Announcement!",
			})
		})

		it("should return error response on service failure", async () => {
			mockAnnouncementService.update.mockResolvedValue({
				status: false,
				err: { message: "Update failed", code: 400 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "announcement-123", tenantId: "tenant-test-123" },
				body: { title: "Updated" },
				jwtPayload: mockJwtPayload,
			})

			await AnnouncementController.update(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Update failed",
			})
		})
	})

	describe("deleteById", () => {
		it("should return 200 on successful deletion", async () => {
			mockAnnouncementService.deleteById.mockResolvedValue({
				status: true,
				data: {},
			})

			const { mock, spy } = createMockContext({
				params: { id: "announcement-123", tenantId: "tenant-test-123" },
				jwtPayload: mockJwtPayload,
			})

			await AnnouncementController.deleteById(mock)

			expect(mockAnnouncementService.deleteById).toHaveBeenCalledWith(
				"announcement-123",
				mockJwtPayload.id,
				"tenant-test-123",
			)
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: {},
				message: "Successfully deleted Announcement!",
			})
		})

		it("should return error response on service failure", async () => {
			mockAnnouncementService.deleteById.mockResolvedValue({
				status: false,
				err: { message: "Announcement not found", code: 404 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent-id", tenantId: "tenant-test-123" },
				jwtPayload: mockJwtPayload,
			})

			await AnnouncementController.deleteById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Announcement not found",
			})
		})
	})
})
