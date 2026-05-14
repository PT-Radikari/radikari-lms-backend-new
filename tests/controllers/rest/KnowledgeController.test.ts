/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"
import { mockUserJWT } from "$factories/assignment"

let mockCreate = jest.fn<any>()
let mockGetAll = jest.fn<any>()
let mockGetAllArchived = jest.fn<any>()
let mockGetSummary = jest.fn<any>()
let mockGetById = jest.fn<any>()
let mockGetAllVersionsById = jest.fn<any>()
let mockUpdate = jest.fn<any>()
let mockDeleteById = jest.fn<any>()
let mockApproveById = jest.fn<any>()
let mockBulkCreate = jest.fn<any>()
let mockBulkCreateTypeCase = jest.fn<any>()
let mockArchiveOrUnarchiveKnowledge = jest.fn<any>()
let mockShareKnowledge = jest.fn<any>()
let mockGetShareHistory = jest.fn<any>()

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
	debug: jest.fn<any>(),
}))

jest.mock("$services/KnowledgeService", () => ({
	create: (...args: any[]) => mockCreate(...args),
	getAll: (...args: any[]) => mockGetAll(...args),
	getAllArchived: (...args: any[]) => mockGetAllArchived(...args),
	getSummary: (...args: any[]) => mockGetSummary(...args),
	getById: (...args: any[]) => mockGetById(...args),
	getAllVersionsById: (...args: any[]) => mockGetAllVersionsById(...args),
	update: (...args: any[]) => mockUpdate(...args),
	deleteById: (...args: any[]) => mockDeleteById(...args),
	approveById: (...args: any[]) => mockApproveById(...args),
	bulkCreate: (...args: any[]) => mockBulkCreate(...args),
	bulkCreateTypeCase: (...args: any[]) => mockBulkCreateTypeCase(...args),
	archiveOrUnarchiveKnowledge: (...args: any[]) => mockArchiveOrUnarchiveKnowledge(...args),
	shareKnowledge: (...args: any[]) => mockShareKnowledge(...args),
	getShareHistory: (...args: any[]) => mockGetShareHistory(...args),
}))

jest.mock("$utils/knowledgeOverdue.utils", () => ({
	attachOverdueToKnowledgeList: jest.fn<any>((data: any) => data),
}))

import * as KnowledgeController from "$controllers/rest/KnowledgeController"

const mockKnowledge = {
	id: "knowledge-123",
	title: "Test Knowledge",
	content: "Test content",
	status: "APPROVED",
	tenantId: "tenant-test-123",
	createdByUserId: "user-test-123",
	createdAt: new Date(),
	updatedAt: new Date(),
}

describe("KnowledgeController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("create", () => {
		it("should return 201 on successful creation", async () => {
			mockCreate.mockResolvedValue({
				status: true,
				data: mockKnowledge,
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				body: { title: "Test Knowledge", content: "Test content" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.create(mock)

			expect(spy.status).toHaveBeenCalledWith(201)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: mockKnowledge,
				message: "Successfully created new Knowledge!",
			})
		})

		it("should return error response on service failure", async () => {
			mockCreate.mockResolvedValue({
				status: false,
				err: { message: "Validation error", code: 400 },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				body: { title: "", content: "Test" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.create(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Validation error",
			})
		})
	})

	describe("getAll", () => {
		it("should return 200 with knowledge list and overdue flags", async () => {
			const paginatedData = { data: [mockKnowledge], page: 1, limit: 10, total: 1 }
			mockGetAll.mockResolvedValue({
				status: true,
				data: paginatedData,
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				query: { page: "1" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: paginatedData,
				message: "Successfully fetched all Knowledge!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetAll.mockResolvedValue({
				status: false,
				err: { message: "Unauthorized", code: 401 },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				query: {},
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(401)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Unauthorized",
			})
		})
	})

	describe("getAllArchived", () => {
		it("should return 200 with archived knowledge list", async () => {
			const paginatedData = { data: [mockKnowledge], page: 1, limit: 10, total: 1 }
			mockGetAllArchived.mockResolvedValue({
				status: true,
				data: paginatedData,
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				query: { page: "1" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.getAllArchived(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: paginatedData,
				message: "Successfully fetched all Archived Knowledge!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetAllArchived.mockResolvedValue({
				status: false,
				err: { message: "Internal Server Error", code: 500 },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				query: {},
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.getAllArchived(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Internal Server Error",
			})
		})
	})

	describe("getSummary", () => {
		it("should return 200 with knowledge summary", async () => {
			const summaryData = {
				total: 10,
				approved: 8,
				pending: 2,
				rejected: 0,
			}
			mockGetSummary.mockResolvedValue({
				status: true,
				data: summaryData,
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				query: {},
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.getSummary(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: summaryData,
				message: "Successfully fetched Knowledge summary!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetSummary.mockResolvedValue({
				status: false,
				err: { message: "Internal Server Error", code: 500 },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				query: {},
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.getSummary(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Internal Server Error",
			})
		})
	})

	describe("getById", () => {
		it("should return 200 with knowledge data", async () => {
			mockGetById.mockResolvedValue({
				status: true,
				data: mockKnowledge,
			})

			const { mock, spy } = createMockContext({
				params: { id: "knowledge-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.getById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: mockKnowledge,
				message: "Successfully fetched Knowledge by id!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetById.mockResolvedValue({
				status: false,
				err: { message: "Knowledge not found", code: 404 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent-id", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.getById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Knowledge not found",
			})
		})
	})

	describe("getAllVersionsById", () => {
		it("should return 200 with knowledge versions", async () => {
			const versionsData = [mockKnowledge, { ...mockKnowledge, id: "v2" }]
			mockGetAllVersionsById.mockResolvedValue({
				status: true,
				data: versionsData,
			})

			const { mock, spy } = createMockContext({
				params: { id: "knowledge-123" },
			})

			await KnowledgeController.getAllVersionsById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: versionsData,
				message: "Successfully fetched all Knowledge versions!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetAllVersionsById.mockResolvedValue({
				status: false,
				err: { message: "Internal Server Error", code: 500 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "knowledge-123" },
			})

			await KnowledgeController.getAllVersionsById(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Internal Server Error",
			})
		})
	})

	describe("update", () => {
		it("should return 200 on successful update", async () => {
			const updatedKnowledge = { ...mockKnowledge, title: "Updated Title" }
			mockUpdate.mockResolvedValue({
				status: true,
				data: updatedKnowledge,
			})

			const { mock, spy } = createMockContext({
				params: { id: "knowledge-123", tenantId: "tenant-test-123" },
				body: { title: "Updated Title" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.update(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: updatedKnowledge,
				message: "Successfully updated Knowledge!",
			})
		})

		it("should return error response on service failure", async () => {
			mockUpdate.mockResolvedValue({
				status: false,
				err: { message: "Update failed", code: 400 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "knowledge-123", tenantId: "tenant-test-123" },
				body: { title: "Updated" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.update(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Update failed",
			})
		})
	})

	describe("deleteById", () => {
		it("should return 200 on successful deletion", async () => {
			mockDeleteById.mockResolvedValue({
				status: true,
				data: {},
			})

			const { mock, spy } = createMockContext({
				params: { id: "knowledge-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.deleteById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: {},
				message: "Successfully deleted Knowledge!",
			})
		})

		it("should return error response on service failure", async () => {
			mockDeleteById.mockResolvedValue({
				status: false,
				err: { message: "Knowledge not found", code: 404 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent-id", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.deleteById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Knowledge not found",
			})
		})
	})

	describe("approveById", () => {
		it("should return 200 on successful approval", async () => {
			const approvedKnowledge = { ...mockKnowledge, status: "APPROVED" }
			mockApproveById.mockResolvedValue({
				status: true,
				data: approvedKnowledge,
			})

			const { mock, spy } = createMockContext({
				params: { id: "knowledge-123", tenantId: "tenant-test-123" },
				body: { status: "APPROVED" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.approveById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: approvedKnowledge,
				message: "Successfully approved Knowledge!",
			})
		})

		it("should return error response on service failure", async () => {
			mockApproveById.mockResolvedValue({
				status: false,
				err: { message: "Approval failed", code: 400 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "knowledge-123", tenantId: "tenant-test-123" },
				body: { status: "APPROVED" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.approveById(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Approval failed",
			})
		})
	})

	describe("bulkCreate", () => {
		it("should return 201 on successful bulk creation for ARTICLE type", async () => {
			const bulkData = { data: [mockKnowledge], createdCount: 1 }
			mockBulkCreate.mockResolvedValue({
				status: true,
				data: bulkData,
			})

			const { mock, spy } = createMockContext({
				body: {
					type: "ARTICLE",
					access: "PUBLIC",
					title: "Bulk Article",
					fileUrls: [],
				},
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.bulkCreate(mock)

			expect(spy.status).toHaveBeenCalledWith(201)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: bulkData,
				message: "Successfully bulk created Knowledge!",
			})
		})

		it("should return 201 on successful bulk creation for CASE type", async () => {
			const bulkData = { data: [mockKnowledge], createdCount: 1 }
			mockBulkCreateTypeCase.mockResolvedValue({
				status: true,
				data: bulkData,
			})

			const { mock, spy } = createMockContext({
				body: {
					type: "CASE",
					access: "PUBLIC",
					title: "Bulk Case",
					fileUrls: [],
				},
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.bulkCreate(mock)

			expect(spy.status).toHaveBeenCalledWith(201)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: bulkData,
				message: "Successfully bulk created Knowledge!",
			})
		})

		it("should return error response on service failure", async () => {
			mockBulkCreate.mockResolvedValue({
				status: false,
				err: { message: "Bulk create failed", code: 400 },
			})

			const { mock, spy } = createMockContext({
				body: {
					type: "ARTICLE",
					access: "PUBLIC",
					title: "Bulk Article",
					fileUrls: [],
				},
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.bulkCreate(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Bulk create failed",
			})
		})
	})

	describe("bulkCreateTypeCase", () => {
		it("should return 201 on successful bulk case creation", async () => {
			const bulkData = { data: [mockKnowledge], createdCount: 1 }
			mockBulkCreateTypeCase.mockResolvedValue({
				status: true,
				data: bulkData,
			})

			const { mock, spy } = createMockContext({
				body: {
					type: "CASE",
					access: "PUBLIC",
					title: "Bulk Case",
					fileUrls: [],
				},
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.bulkCreateTypeCase(mock)

			expect(spy.status).toHaveBeenCalledWith(201)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: bulkData,
				message: "Successfully bulk created Knowledge!",
			})
		})

		it("should return error response on service failure", async () => {
			mockBulkCreateTypeCase.mockResolvedValue({
				status: false,
				err: { message: "Bulk case create failed", code: 400 },
			})

			const { mock, spy } = createMockContext({
				body: {
					type: "CASE",
					access: "PUBLIC",
					title: "Bulk Case",
					fileUrls: [],
				},
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.bulkCreateTypeCase(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Bulk case create failed",
			})
		})
	})

	describe("archiveOrUnarchiveKnowledge", () => {
		it("should return 200 on successful archive/unarchive", async () => {
			const archivedKnowledge = { ...mockKnowledge, isArchived: true }
			mockArchiveOrUnarchiveKnowledge.mockResolvedValue({
				status: true,
				data: archivedKnowledge,
			})

			const { mock, spy } = createMockContext({
				params: { id: "knowledge-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.archiveOrUnarchiveKnowledge(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: archivedKnowledge,
				message: "Successfully archived or unarchived Knowledge!",
			})
		})

		it("should return error response on service failure", async () => {
			mockArchiveOrUnarchiveKnowledge.mockResolvedValue({
				status: false,
				err: { message: "Archive failed", code: 400 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "knowledge-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.archiveOrUnarchiveKnowledge(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Archive failed",
			})
		})
	})

	describe("shareKnowledge", () => {
		it("should return 200 on successful knowledge sharing", async () => {
			mockShareKnowledge.mockResolvedValue({
				status: true,
				data: { shared: true, emails: ["test@example.com"] },
			})

			const { mock, spy } = createMockContext({
				params: { id: "knowledge-123", tenantId: "tenant-test-123" },
				body: { emails: ["test@example.com"] },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.shareKnowledge(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: { shared: true, emails: ["test@example.com"] },
				message: "Successfully shared knowledge!",
			})
		})

		it("should return 400 when emails are empty", async () => {
			const { mock, spy } = createMockContext({
				params: { id: "knowledge-123", tenantId: "tenant-test-123" },
				body: { emails: [] },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.shareKnowledge(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Emails are required",
			})
		})

		it("should return 400 when emails is undefined", async () => {
			const { mock, spy } = createMockContext({
				params: { id: "knowledge-123", tenantId: "tenant-test-123" },
				body: {},
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.shareKnowledge(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Emails are required",
			})
		})

		it("should return error response on service failure", async () => {
			mockShareKnowledge.mockResolvedValue({
				status: false,
				err: { message: "Share failed", code: 400 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "knowledge-123", tenantId: "tenant-test-123" },
				body: { emails: ["test@example.com"] },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.shareKnowledge(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Share failed",
			})
		})
	})

	describe("getShareHistory", () => {
		it("should return 200 with share history", async () => {
			const historyData = [
				{ id: "sh-1", knowledgeId: "knowledge-123", sharedWith: "test@example.com" },
			]
			mockGetShareHistory.mockResolvedValue({
				status: true,
				data: historyData,
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				query: { page: "1" },
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.getShareHistory(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: historyData,
				message: "Successfully fetched share history!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetShareHistory.mockResolvedValue({
				status: false,
				err: { message: "Internal Server Error", code: 500 },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				query: {},
				jwtPayload: mockUserJWT,
			})

			await KnowledgeController.getShareHistory(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Internal Server Error",
			})
		})
	})
})
