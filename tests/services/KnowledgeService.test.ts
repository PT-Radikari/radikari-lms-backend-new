/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import {
	approveById,
	getAll,
	getById,
	getAllVersionsById,
	bulkCreate,
	bulkCreateTypeCase,
	archiveOrUnarchiveKnowledge,
	shareKnowledge,
	getShareHistory,
	sendKnowledgeApprovalNotification,
	create,
	getAllArchived,
	getSummary,
	update,
	deleteById,
} from "$services/KnowledgeService"
import { KnowledgeActivityLogAction, KnowledgeAccess } from "$generated/prisma/client"

// =========================================================
// Mock setup — ALL mocks at module level, initialized before jest.mock()
// =========================================================
var mockSendToQueue: ReturnType<typeof jest.fn<any>>
var mockPrismaCount: ReturnType<typeof jest.fn<any>>
var mockPrismaFindMany: ReturnType<typeof jest.fn<any>>
var mockGetById: ReturnType<typeof jest.fn<any>>
var mockUpdateStatus: ReturnType<typeof jest.fn<any>>
var mockCreate: ReturnType<typeof jest.fn<any>>
var mockGetAll: ReturnType<typeof jest.fn<any>>
var mockGetAllArchived: ReturnType<typeof jest.fn<any>>
var mockGetSummary: ReturnType<typeof jest.fn<any>>
var mockUpdate: ReturnType<typeof jest.fn<any>>
var mockDeleteById: ReturnType<typeof jest.fn<any>>
var mockGetAllVersionsById: ReturnType<typeof jest.fn<any>>
var mockCreateMany: ReturnType<typeof jest.fn<any>>
var mockCreateManyAttachments: ReturnType<typeof jest.fn<any>>
var mockCreateManyContent: ReturnType<typeof jest.fn<any>>
var mockCreateShare: ReturnType<typeof jest.fn<any>>
var mockFindUsersByEmails: ReturnType<typeof jest.fn<any>>
var mockGetByIds: ReturnType<typeof jest.fn<any>>
var mockArchiveOrUnarchiveKnowledge: ReturnType<typeof jest.fn<any>>
var mockIncrementTotalViews: ReturnType<typeof jest.fn<any>>
var mockTenantGetByName: ReturnType<typeof jest.fn<any>>
var mockTenantGetById: ReturnType<typeof jest.fn<any>>
var mockTenantCreate: ReturnType<typeof jest.fn<any>>
var mockOpFindFirst: ReturnType<typeof jest.fn<any>>
var mockActivityCreate: ReturnType<typeof jest.fn<any>>
var mockNotifyTenantUsers: ReturnType<typeof jest.fn<any>>
var mockNotifySpecificUsers: ReturnType<typeof jest.fn<any>>
var mockAxiosGet: ReturnType<typeof jest.fn<any>>
var mockXlsxRead: ReturnType<typeof jest.fn<any>>
var mockXlsxSheetToJson: ReturnType<typeof jest.fn<any>>

// Initialize BEFORE jest.mock() so hoisting can resolve them
mockSendToQueue = jest.fn<any>()
mockPrismaCount = jest.fn<any>()
mockPrismaFindMany = jest.fn<any>()
mockGetById = jest.fn<any>()
mockUpdateStatus = jest.fn<any>()
mockCreate = jest.fn<any>()
mockGetAll = jest.fn<any>()
mockGetAllArchived = jest.fn<any>()
mockGetSummary = jest.fn<any>()
mockUpdate = jest.fn<any>()
mockDeleteById = jest.fn<any>()
mockGetAllVersionsById = jest.fn<any>()
mockCreateMany = jest.fn<any>()
mockCreateManyAttachments = jest.fn<any>()
mockCreateManyContent = jest.fn<any>()
mockCreateShare = jest.fn<any>()
mockFindUsersByEmails = jest.fn<any>()
mockGetByIds = jest.fn<any>()
mockArchiveOrUnarchiveKnowledge = jest.fn<any>()
mockIncrementTotalViews = jest.fn<any>()
mockTenantGetByName = jest.fn<any>()
mockTenantGetById = jest.fn<any>()
mockTenantCreate = jest.fn<any>()
mockOpFindFirst = jest.fn<any>()
mockActivityCreate = jest.fn<any>()
mockNotifyTenantUsers = jest.fn<any>()
mockNotifySpecificUsers = jest.fn<any>()
mockAxiosGet = jest.fn<any>()
mockXlsxRead = jest.fn<any>()
mockXlsxSheetToJson = jest.fn<any>()

// Wire mocks into modules
jest.mock("$repositories/KnowledgeRepository", () => ({
	getById: mockGetById,
	updateStatus: mockUpdateStatus,
	create: mockCreate,
	getAll: mockGetAll,
	getAllArchived: mockGetAllArchived,
	getSummary: mockGetSummary,
	update: mockUpdate,
	deleteById: mockDeleteById,
	getAllVersionsById: mockGetAllVersionsById,
	createMany: mockCreateMany,
	createManyAttachments: mockCreateManyAttachments,
	createManyContent: mockCreateManyContent,
	createShare: mockCreateShare,
	findUsersByEmails: mockFindUsersByEmails,
	getByIds: mockGetByIds,
	archiveOrUnarchiveKnowledge: mockArchiveOrUnarchiveKnowledge,
	incrementTotalViews: mockIncrementTotalViews,
}))

jest.mock("$repositories/TenantRepository", () => ({
	getByName: mockTenantGetByName,
	getById: mockTenantGetById,
	create: mockTenantCreate,
}))

jest.mock("$repositories/OperationRepository", () => ({
	findFirst: mockOpFindFirst,
}))

jest.mock("$services/UserActivityLogService", () => ({
	create: mockActivityCreate,
}))

jest.mock("$services/NotificationService", () => ({
	notifyTenantUsers: mockNotifyTenantUsers,
	notifySpecificUsers: mockNotifySpecificUsers,
}))

jest.mock("$pkg/pubsub", () => ({
	default: { sendToQueue: mockSendToQueue },
	GlobalPubSub: {
		getInstance: () => ({ getPubSub: () => ({ sendToQueue: mockSendToQueue }) }),
	},
	PUBSUB_TOPICS: {
		KNOWLEDGE_CREATE: "KNOWLEDGE_CREATE",
		KNOWLEDGE_APPROVAL_NOTIFICATION: "KNOWLEDGE_APPROVAL_NOTIFICATION",
		KNOWLEDGE_UPDATE: "KNOWLEDGE_UPDATE",
		KNOWLEDGE_DELETE: "KNOWLEDGE_DELETE",
	},
}))

jest.mock("$pkg/prisma", () => ({
	prisma: {
		knowledgeShare: {
			count: mockPrismaCount,
			findMany: mockPrismaFindMany,
		},
	},
}))

jest.mock("axios", () => ({
	get: mockAxiosGet,
}))

jest.mock("xlsx", () => ({
	read: mockXlsxRead,
	utils: { sheet_to_json: mockXlsxSheetToJson },
}))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warning: jest.fn<any>(),
}))

// =========================================================
// Shared helpers
// =========================================================
const commonKnowledge = (headline: string) => ({
	id: "k", headline, knowledgeContent: [], knowledgeAttachment: [],
	type: "ARTICLE" as const, access: "TENANT" as const, tenantId: "tenant-123",
	userKnowledge: [] as any[], createdByUserId: "user-123",
})

// =========================================================
// Default mock reset — runs before every test
// =========================================================
beforeEach(() => {
	(jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mockReset()
	(jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mockResolvedValue(undefined)
	(jest.requireMock("$pkg/prisma") as any).prisma.knowledgeShare.count.mockReset()
	(jest.requireMock("$pkg/prisma") as any).prisma.knowledgeShare.count.mockResolvedValue(0)
	(jest.requireMock("$pkg/prisma") as any).prisma.knowledgeShare.findMany.mockReset()
	(jest.requireMock("$pkg/prisma") as any).prisma.knowledgeShare.findMany.mockResolvedValue([])

	(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).updateStatus.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).create.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).getAll.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).getAllArchived.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).getSummary.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).update.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).deleteById.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).getAllVersionsById.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).createShare.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).findUsersByEmails.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).getByIds.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).archiveOrUnarchiveKnowledge.mockReset()
	(jest.requireMock("$repositories/KnowledgeRepository") as any).incrementTotalViews.mockReset()

	(jest.requireMock("$repositories/TenantRepository") as any).getByName.mockReset()
	(jest.requireMock("$repositories/TenantRepository") as any).getById.mockReset()
	(jest.requireMock("$repositories/TenantRepository") as any).create.mockReset()

	(jest.requireMock("$repositories/OperationRepository") as any).findFirst.mockReset()
	(jest.requireMock("$services/UserActivityLogService") as any).create.mockReset()

	(jest.requireMock("$services/NotificationService") as any).notifyTenantUsers.mockReset()
	(jest.requireMock("$services/NotificationService") as any).notifySpecificUsers.mockReset()

	(jest.requireMock("axios") as any).get.mockReset()
	(jest.requireMock("xlsx") as any).read.mockReset()
	(jest.requireMock("xlsx") as any).utils.sheet_to_json.mockReset()
})

// =========================================================
// Original tests — RAG Verification
// =========================================================
describe("KnowledgeService RAG Verification", () => {
	const userId = "user-123"
	const tenantId = "tenant-123"

	it("should send Excel/Markdown content to RAG queue on approval", async () => {
		const mockKnowledgeExcel = {
			id: "know-excel-1",
			headline: "Q1 Sales Report",
			status: "PENDING",
			createdByUserId: "creator-1",
			tenantId: tenantId,
			access: KnowledgeAccess.TENANT,
			type: "ARTICLE",
			category: "Sales",
			subCategory: "Reports",
			case: "Quarterly",
			userKnowledge: [],
			knowledgeAttachment: [{ attachmentUrl: "https://storage.com/data.xlsx" }],
			knowledgeContent: [
				{
					title: "Q1 Sales Data",
					description: "| Product | Qty | Revenue |\n|---|---|---|\n| Widget A | 100 | $1000 |",
				},
			],
		};
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue(mockKnowledgeExcel)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).updateStatus.mockResolvedValue({ ...mockKnowledgeExcel, status: "APPROVED" })
		(jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mockResolvedValue(undefined)

		const result = await approveById(mockKnowledgeExcel.id, tenantId, userId, {
			action: KnowledgeActivityLogAction.APPROVE,
			comment: "Looks good",
		})

		expect(result.status).toBe(true)
		expect(mockSendToQueue).toHaveBeenCalled()

		const calls = (jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mock.calls
		const createCall = calls.find((call: any[]) => call[0] === "KNOWLEDGE_CREATE")
		expect(createCall).toBeDefined()

		const payload = (createCall as any[])[1]
		expect(payload?.content).toContain("Headline: Q1 Sales Report")
		expect(payload?.content).toContain("| Product | Qty | Revenue |")
		expect(payload?.content).toContain("| Widget A | 100 | $1000 |")
	})

	it("should send Video metadata to RAG queue on approval", async () => {
		const mockKnowledgeVideo = {
			id: "know-video-1",
			headline: "Server Setup Tutorial",
			status: "PENDING",
			createdByUserId: "creator-1",
			tenantId: tenantId,
			access: KnowledgeAccess.TENANT,
			type: "ARTICLE",
			category: "IT",
			subCategory: "Infrastructure",
			case: "Setup",
			userKnowledge: [],
			knowledgeAttachment: [{ attachmentUrl: "https://storage.com/tutorial.mp4" }],
			knowledgeContent: [
				{
					title: "Video Description",
					description: "Watch this video to learn how to setup the server.",
				},
			],
		};
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue(mockKnowledgeVideo)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).updateStatus.mockResolvedValue({ ...mockKnowledgeVideo, status: "APPROVED" })
		(jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mockResolvedValue(undefined)

		const result = await approveById(mockKnowledgeVideo.id, tenantId, userId, {
			action: KnowledgeActivityLogAction.APPROVE,
			comment: "Approved video",
		})

		expect(result.status).toBe(true)

		const calls = (jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mock.calls
		const createCall = calls.find((call: any[]) => call[0] === "KNOWLEDGE_CREATE")
		expect(createCall).toBeDefined()

		const payload = (createCall as any[])[1]
		expect(payload?.content).toContain("Headline: Server Setup Tutorial")
		expect(payload?.fileUrls).toContain("https://storage.com/tutorial.mp4")
	})
})

// =========================================================
// approveById — PubSub sequential failure
// =========================================================
describe("KnowledgeService — approveById PubSub sequential failure", () => {
	const baseData = {
		id: "know-123", headline: "Test", status: "PENDING", type: "ARTICLE",
		access: "TENANT" as const, tenantId: "tenant-123",
		userKnowledge: [] as any[], knowledgeAttachment: [] as any[], createdByUserId: "user-123",
	}

	it("KNOWLEDGE_CREATE failure → KNOWLEDGE_APPROVAL_NOTIFICATION never called", async () => {
		mockGetById
			.mockResolvedValueOnce(baseData)
			.mockResolvedValueOnce({ ...baseData, status: "APPROVED" })
		(jest.requireMock("$repositories/KnowledgeRepository") as any).updateStatus.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getByIds.mockResolvedValue([])
		(jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mockRejectedValueOnce(new Error("Queue down"))

		const result = await approveById("know-123", "tenant-123", "user-123", {
			action: KnowledgeActivityLogAction.APPROVE,
		})

		expect(result.status).toBe(true)
		expect((jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mock.calls.length).toBe(1)
		expect((jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mock.calls[0][0]).toBe("KNOWLEDGE_CREATE")
	})

	it("both PubSub succeed sequentially", async () => {
		mockGetById
			.mockResolvedValueOnce(baseData)
			.mockResolvedValueOnce({ ...baseData, status: "APPROVED" })
		(jest.requireMock("$repositories/KnowledgeRepository") as any).updateStatus.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getByIds.mockResolvedValue([])

		const result = await approveById("know-123", "tenant-123", "user-123", {
			action: KnowledgeActivityLogAction.APPROVE,
		})

		expect(result.status).toBe(true)
		expect(mockSendToQueue).toHaveBeenCalledTimes(2)
		expect((jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mock.calls[0][0]).toBe("KNOWLEDGE_CREATE")
		expect((jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mock.calls[1][0]).toBe("KNOWLEDGE_APPROVAL_NOTIFICATION")
	})
})

// =========================================================
// sendKnowledgeApprovalNotification
// =========================================================
describe("KnowledgeService — sendKnowledgeApprovalNotification", () => {
	it("returns early when knowledge not found", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue(null)
		await sendKnowledgeApprovalNotification("nonexistent", "user-123")
		expect(mockNotifyTenantUsers).not.toHaveBeenCalled()
		expect(mockNotifySpecificUsers).not.toHaveBeenCalled()
	})

	it("notifies tenant users for TENANT access", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "k1", headline: "Test", access: "TENANT", tenantId: "tenant-123" })
		await sendKnowledgeApprovalNotification("k1", "user-123")
		expect(mockNotifyTenantUsers).toHaveBeenCalled()
	})

	it("notifies specific users for EMAIL access (excludes excludeUserId)", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "k1", headline: "Shared", access: "EMAIL", tenantId: "tenant-123" })
		(jest.requireMock("$repositories/KnowledgeRepository") as any).findUsersByEmails.mockResolvedValue([
			{ userId: "user-a", fullName: "Alice" },
			{ userId: "user-b", fullName: "Bob" },
			{ userId: "user-c", fullName: "Charlie" },
		])
		await sendKnowledgeApprovalNotification("k1", "user-b")
		expect(mockNotifySpecificUsers).toHaveBeenCalledWith(
			["user-a", "user-c"], "tenant-123", expect.any(String),
			"Pengetahuan Baru Tersedia", expect.stringContaining("Shared"), "k1",
		)
	})

	it("notifies tenant users for PUBLIC access", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "k1", headline: "Public", access: "PUBLIC", tenantId: "tenant-123" })
		await sendKnowledgeApprovalNotification("k1", "user-123")
		expect(mockNotifyTenantUsers).toHaveBeenCalled()
	})
})

// =========================================================
// bulkCreateTypeCase
// =========================================================
describe("KnowledgeService — bulkCreateTypeCase", () => {
	it("parses Excel and creates one knowledge per row", async () => {
		(jest.requireMock("axios") as any).get.mockResolvedValue({ data: Buffer.from("fake") })
		(jest.requireMock("xlsx") as any).read.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {}, Knowledge: {}, Case: {} } })
		(jest.requireMock("xlsx") as any).utils.sheet_to_json.mockReturnValue([{ headline: "A1" }, { headline: "A2" }])
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getByIds.mockResolvedValue([commonKnowledge("A1"), commonKnowledge("A2")])

		const result = await bulkCreateTypeCase({
			fileUrls: ["https://x.xlsx"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
		} as any, "user-123")

		expect(result.status).toBe(true)
		expect((jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mock.calls[0][0]).toHaveLength(2)
	})

	it("attaches Excel file to all created knowledge entries", async () => {
		(jest.requireMock("axios") as any).get.mockResolvedValue({ data: Buffer.from("fake") })
		(jest.requireMock("xlsx") as any).read.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {}, Knowledge: {}, Case: {} } })
		(jest.requireMock("xlsx") as any).utils.sheet_to_json.mockReturnValue([{ headline: "A1" }])
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getByIds.mockResolvedValue([commonKnowledge("A1")])

		await bulkCreateTypeCase({
			fileUrls: ["https://x.xlsx"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
		} as any, "user-123")

		expect(mockCreateManyAttachments).toHaveBeenCalled()
	})

	it("publishes KNOWLEDGE_CREATE for each knowledge", async () => {
		(jest.requireMock("axios") as any).get.mockResolvedValue({ data: Buffer.from("fake") })
		(jest.requireMock("xlsx") as any).read.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {}, Knowledge: {}, Case: {} } })
		(jest.requireMock("xlsx") as any).utils.sheet_to_json.mockReturnValue([{ headline: "A1" }])
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getByIds.mockResolvedValue([commonKnowledge("A1")])

		await bulkCreateTypeCase({
			fileUrls: ["https://x.xlsx"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
		} as any, "user-123")

		expect(mockSendToQueue).toHaveBeenCalledWith("KNOWLEDGE_CREATE", expect.any(Object))
	})

	it("skips rows missing headline", async () => {
		(jest.requireMock("axios") as any).get.mockResolvedValue({ data: Buffer.from("fake") })
		(jest.requireMock("xlsx") as any).read.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {}, Knowledge: {}, Case: {} } })
		(jest.requireMock("xlsx") as any).utils.sheet_to_json.mockReturnValue([{ other: "x" }, { headline: "Valid" }])
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getByIds.mockResolvedValue([commonKnowledge("Valid")])

		const result = await bulkCreateTypeCase({
			fileUrls: ["https://x.xlsx"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
		} as any, "user-123")

		expect(result.status).toBe(true)
		expect((jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mock.calls[0][0]).toHaveLength(1)
	})

	it("whitespace-only headlines ARE created (production: !headline skips falsy only)", async () => {
		(jest.requireMock("axios") as any).get.mockResolvedValue({ data: Buffer.from("fake") })
		(jest.requireMock("xlsx") as any).read.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {}, Knowledge: {}, Case: {} } })
		(jest.requireMock("xlsx") as any).utils.sheet_to_json.mockReturnValue([{ headline: "" }, { headline: "   " }, { headline: "Valid" }])
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getByIds.mockResolvedValue([commonKnowledge("   "), commonKnowledge("Valid")])

		const result = await bulkCreateTypeCase({
			fileUrls: ["https://x.xlsx"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
		} as any, "user-123")

		expect(result.status).toBe(true)
		expect((jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mock.calls[0][0]).toHaveLength(2)
	})

	it("normalizes column keys (trim + lowercase)", async () => {
		(jest.requireMock("axios") as any).get.mockResolvedValue({ data: Buffer.from("fake") })
		(jest.requireMock("xlsx") as any).read.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {}, Knowledge: {}, Case: {} } })
		(jest.requireMock("xlsx") as any).utils.sheet_to_json.mockReturnValue([{ "  Headline  ": "A1", "Category": "Sales" }])
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getByIds.mockResolvedValue([commonKnowledge("A1")])

		const result = await bulkCreateTypeCase({
			fileUrls: ["https://x.xlsx"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
		} as any, "user-123")

		expect(result.status).toBe(true)
	})

	it("handles aliased column names (detail case, title, judul, topik, nama pengetahuan)", async () => {
		(jest.requireMock("axios") as any).get.mockResolvedValue({ data: Buffer.from("fake") })
		(jest.requireMock("xlsx") as any).read.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {}, Knowledge: {}, Case: {} } })
		(jest.requireMock("xlsx") as any).utils.sheet_to_json.mockReturnValue([
			{ "detail case": "D1" },
			{ title: "T1" },
			{ judul: "J1" },
			{ topik: "Top1" },
			{ "nama pengetahuan": "NP1" },
		])
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getByIds.mockResolvedValue([
			commonKnowledge("D1"), commonKnowledge("T1"),
			commonKnowledge("J1"), commonKnowledge("Top1"), commonKnowledge("NP1"),
		])

		const result = await bulkCreateTypeCase({
			fileUrls: ["https://x.xlsx"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
		} as any, "user-123")

		expect(result.status).toBe(true)
		expect((jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mock.calls[0][0]).toHaveLength(5)
	})

	it("returns early when no Excel files in URLs", async () => {
		const result = await bulkCreateTypeCase({
			fileUrls: ["https://doc.pdf"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
		} as any, "user-123")
		expect(result.status).toBe(true)
	})

	it("returns 400 when no valid rows (all missing headline)", async () => {
		(jest.requireMock("axios") as any).get.mockResolvedValue({ data: Buffer.from("fake") })
		(jest.requireMock("xlsx") as any).read.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {}, Knowledge: {}, Case: {} } })
		(jest.requireMock("xlsx") as any).utils.sheet_to_json.mockReturnValue([{ other: "x" }, { case: "c" }])
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockResolvedValue(undefined)

		const result = await bulkCreateTypeCase({
			fileUrls: ["https://x.xlsx"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
		} as any, "user-123")

		expect(result.status).toBe(false)
	})

	it("returns 500 when axios download fails", async () => {
		(jest.requireMock("axios") as any).get.mockRejectedValue(new Error("Network error"))

		const result = await bulkCreateTypeCase({
			fileUrls: ["https://x.xlsx"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
		} as any, "user-123")

		expect(result.status).toBe(false)
	})

	it("swallows PubSub failure → still returns success", async () => {
		(jest.requireMock("axios") as any).get.mockResolvedValue({ data: Buffer.from("fake") })
		(jest.requireMock("xlsx") as any).read.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {}, Knowledge: {}, Case: {} } })
		(jest.requireMock("xlsx") as any).utils.sheet_to_json.mockReturnValue([{ headline: "A1" }])
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getByIds.mockResolvedValue([commonKnowledge("A1")])
		(jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mockRejectedValue(new Error("Queue down"))

		const result = await bulkCreateTypeCase({
			fileUrls: ["https://x.xlsx"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
		} as any, "user-123")

		expect(result.status).toBe(true)
	})

	it("uses 3rd sheet if available", async () => {
		(jest.requireMock("axios") as any).get.mockResolvedValue({ data: Buffer.from("fake") })
		(jest.requireMock("xlsx") as any).read.mockReturnValue({
			SheetNames: ["F", "S", "T"],
			Sheets: { F: {}, S: {}, T: {}, Knowledge: {}, Case: {} },
		})
		(jest.requireMock("xlsx") as any).utils.sheet_to_json.mockReturnValue([{ headline: "From T" }])
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getByIds.mockResolvedValue([commonKnowledge("From T")])

		const result = await bulkCreateTypeCase({
			fileUrls: ["https://x.xlsx"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
		} as any, "user-123")

		expect(result.status).toBe(true)
	})

	it("resolves tenant by name and creates if not exists", async () => {
		(jest.requireMock("axios") as any).get.mockResolvedValue({ data: Buffer.from("fake") })
		(jest.requireMock("xlsx") as any).read.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {}, Knowledge: {}, Case: {} } })
		(jest.requireMock("xlsx") as any).utils.sheet_to_json.mockReturnValue([{ headline: "A1", "tenant name": "New Tenant" }])
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getByIds.mockResolvedValue([{ ...commonKnowledge("A1"), tenantId: "new-id" }])
		(jest.requireMock("$repositories/TenantRepository") as any).getByName.mockResolvedValue(null)
		(jest.requireMock("$repositories/OperationRepository") as any).findFirst.mockResolvedValue({ id: "op-1" })
		(jest.requireMock("$repositories/TenantRepository") as any).create.mockResolvedValue({ id: "new-id", name: "New Tenant" })

		const result = await bulkCreateTypeCase({
			fileUrls: ["https://x.xlsx"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
		} as any, "user-123")

		expect(result.status).toBe(true)
		expect(mockTenantGetByName).toHaveBeenCalledWith("New Tenant")
		expect(mockTenantCreate).toHaveBeenCalled()
	})

	it("uses default tenantId when row has no tenant name", async () => {
		(jest.requireMock("axios") as any).get.mockResolvedValue({ data: Buffer.from("fake") })
		(jest.requireMock("xlsx") as any).read.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {}, Knowledge: {}, Case: {} } })
		(jest.requireMock("xlsx") as any).utils.sheet_to_json.mockReturnValue([{ headline: "A1" }])
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockResolvedValue(undefined)
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getByIds.mockResolvedValue([commonKnowledge("A1")])

		const result = await bulkCreateTypeCase({
			fileUrls: ["https://x.xlsx"], tenantId: "default-tenant", access: "TENANT", type: "ARTICLE",
		} as any, "user-123")

		expect(result.status).toBe(true)
		expect(mockTenantGetByName).not.toHaveBeenCalled()
	})
})

// =========================================================
// Deep Edge Cases — untested methods from coverage analysis
// =========================================================
describe("KnowledgeService — untested methods", () => {
	describe("getAll", () => {
		it("returns paginated knowledge list", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).getAll.mockResolvedValue({ data: [{ id: "know-1" }], total: 1 })
			const result = await getAll({ id: "user-1" } as any, "tenant-123", {} as any)
			expect(result.status).toBe(true)
		})
	})

	describe("getById", () => {
		it("returns knowledge when found", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "know-1", headline: "Test" })
			const result = await getById("know-1", "tenant-123", "user-123")
			expect(result.status).toBe(true)
		})

		it("returns NOT_FOUND when knowledge does not exist", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue(null)
			const result = await getById("nonexistent", "tenant-123", "user-123")
			expect(result.status).toBe(false)
		})

		it("increments view count when accessed by non-owner", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({
				id: "know-1", headline: "Test", createdByUserId: "other-user",
			})
			await getById("know-1", "tenant-123", "user-123")
			expect(mockIncrementTotalViews).toHaveBeenCalledWith("know-1")
		})
	})

	describe("getAllVersionsById", () => {
		it("returns versions when found", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).getAllVersionsById.mockResolvedValue([
				{ id: "v1", version: 1, headline: "Original" },
				{ id: "v2", version: 2, headline: "Updated" },
			])
			const result = await getAllVersionsById("know-1")
			expect(result.status).toBe(true)
		})

		it("returns NOT_FOUND when no versions exist", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).getAllVersionsById.mockResolvedValue([])
			const result = await getAllVersionsById("know-1")
			expect(result.status).toBe(false)
		})

		it("returns NOT_FOUND when versions is null", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).getAllVersionsById.mockResolvedValue(null)
			const result = await getAllVersionsById("know-1")
			expect(result.status).toBe(false)
		})

		it("returns 500 on repo error", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).getAllVersionsById.mockRejectedValue(new Error("DB error"))
			const result = await getAllVersionsById("know-1")
			expect(result.status).toBe(false)
		})
	})

	describe("bulkCreate", () => {
		it("creates single knowledge with all files as attachments", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockResolvedValue(undefined)
			(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockResolvedValue(undefined)
			(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockResolvedValue(undefined)

			const result = await bulkCreate({
				fileUrls: ["https://x.xlsx", "https://doc.pdf", "https://data.docx"],
				tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
			} as any, "user-123")

			expect(result.status).toBe(true)
			expect(mockCreateMany).toHaveBeenCalledTimes(1)
			expect((jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mock.calls[0][0]).toHaveLength(1)
			expect(mockCreateManyAttachments).toHaveBeenCalledTimes(1)
			expect((jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mock.calls[0][0]).toHaveLength(3)
		})

		it("skips creation when no files provided", async () => {
			const result = await bulkCreate({
				fileUrls: [], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
			} as any, "user-123")
			expect(result.status).toBe(true)
			expect(mockCreateMany).not.toHaveBeenCalled()
		})

		it("returns 500 on repo error", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockRejectedValue(new Error("DB error"))
			const result = await bulkCreate({
				fileUrls: ["https://xlsx"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
			} as any, "user-123")
			expect(result.status).toBe(false)
		})

		it("generates headline with date prefix", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).createMany.mockResolvedValue(undefined)
			(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyAttachments.mockResolvedValue(undefined)
			(jest.requireMock("$repositories/KnowledgeRepository") as any).createManyContent.mockResolvedValue(undefined)
			await bulkCreate({
				fileUrls: ["https://xlsx"], tenantId: "tenant-123", access: "TENANT", type: "ARTICLE",
			} as any, "user-123")
			const calls = (mockCreateMany as any).mock.calls
			expect(calls[0][0][0]).toBeDefined()
		})
	})

	describe("archiveOrUnarchiveKnowledge", () => {
		it("toggles isArchived (always toggles, no action param)", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "know-1", headline: "Test", isArchived: false })
			(jest.requireMock("$repositories/KnowledgeRepository") as any).archiveOrUnarchiveKnowledge.mockResolvedValue(undefined)
			const result = await archiveOrUnarchiveKnowledge("know-1", "user-123", "tenant-123")
			expect(result.status).toBe(true)
		})

		it("returns NOT_FOUND when knowledge does not exist", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue(null)
			const result = await archiveOrUnarchiveKnowledge("know-1", "user-123", "tenant-123")
			expect(result.status).toBe(false)
		})

		it("logs archive activity with headline", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "know-1", headline: "Test Article", isArchived: false })
			(jest.requireMock("$repositories/KnowledgeRepository") as any).archiveOrUnarchiveKnowledge.mockResolvedValue(undefined)
			await archiveOrUnarchiveKnowledge("know-1", "user-123", "tenant-123")
			expect(mockActivityCreate).toHaveBeenCalledWith(
				"user-123", expect.stringContaining("mengarsipkan"), "tenant-123",
				expect.stringContaining("Test Article"),
			)
		})
	})

	describe("shareKnowledge", () => {
		it("creates share record with matched and unmatched emails", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "know-1", headline: "Shared", tenantId: "tenant-123" })
			(jest.requireMock("$repositories/KnowledgeRepository") as any).findUsersByEmails.mockResolvedValue([
				{ userId: "user-a", fullName: "Alice" },
				{ userId: "user-c", fullName: "Charlie" },
			])
			(jest.requireMock("$repositories/KnowledgeRepository") as any).createShare.mockResolvedValue({ id: "share-1" })

			const result = await shareKnowledge("user-123", "tenant-123", "know-1", {
				emails: ["a@test.com", "b@test.com", "c@test.com"], note: "Check this out",
			} as any)

			expect(result.status).toBe(true)
			expect(mockCreateShare).toHaveBeenCalledWith(expect.objectContaining({
				knowledgeId: "know-1", sharedByUserId: "user-123",
			}))
		})

		it("returns NOT_FOUND when knowledge does not exist", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue(null)
			const result = await shareKnowledge("user-123", "tenant-123", "know-1", {
				emails: ["a@test.com"],
			} as any)
			expect(result.status).toBe(false)
		})

		it("logs activity with recipient count", async () => {
			(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "know-1", headline: "Shared Article", tenantId: "tenant-123" })
			(jest.requireMock("$repositories/KnowledgeRepository") as any).findUsersByEmails.mockResolvedValue([])
			(jest.requireMock("$repositories/KnowledgeRepository") as any).createShare.mockResolvedValue({ id: "share-1" })

			await shareKnowledge("user-123", "tenant-123", "know-1", {
				emails: ["a@test.com", "b@test.com", "c@test.com"], note: "",
			} as any)

			expect(mockActivityCreate).toHaveBeenCalledWith(
				"user-123", "Membagikan pengetahuan", "tenant-123",
				expect.stringContaining("3 orang"),
			)
		})
	})

	describe("getShareHistory", () => {
		it("returns paginated share history for sharedByUserId", async () => {
			(jest.requireMock("$pkg/prisma") as any).prisma.knowledgeShare.count.mockResolvedValue(5)
			(jest.requireMock("$pkg/prisma") as any).prisma.knowledgeShare.findMany.mockResolvedValue([{
				id: "share-1",
				knowledge: { id: "know-1", headline: "Shared", type: "ARTICLE", status: "APPROVED", tenantId: "tenant-123" },
				sharedByUser: { fullName: "Alice", email: "alice@test.com" },
				recipients: [],
				createdAt: new Date(),
			}])

			const result = await getShareHistory("user-123", "tenant-123", {} as any)

			expect(result.status).toBe(true)
			expect(result.data).toHaveProperty("entries")
			expect(result.data).toHaveProperty("totalData")
		})

		it("returns paginated share history for recipients", async () => {
			(jest.requireMock("$pkg/prisma") as any).prisma.knowledgeShare.count.mockResolvedValue(1)
			(jest.requireMock("$pkg/prisma") as any).prisma.knowledgeShare.findMany.mockResolvedValue([{
				id: "share-1",
				knowledge: { id: "know-1", headline: "Shared", type: "ARTICLE", status: "APPROVED", tenantId: "tenant-123" },
				sharedByUser: { fullName: "Bob", email: "bob@test.com" },
				recipients: [{ recipientUser: { fullName: "Charlie", email: "c@test.com" } }],
				createdAt: new Date(),
			}])

			const result = await getShareHistory("user-123", "tenant-123", {} as any)

			expect(result.status).toBe(true)
			expect(result.data).toHaveProperty("entries")
		})

		it("returns 500 on Prisma error", async () => {
			const orig = mockPrismaCount.getMockImplementation()
			(jest.requireMock("$pkg/prisma") as any).prisma.knowledgeShare.count.mockImplementation(() => { throw new Error("DB error") })
			try {
				const result = await getShareHistory("user-123", "tenant-123", {} as any)
				expect(result.status).toBe(false)
			} finally {
				(jest.requireMock("$pkg/prisma") as any).prisma.knowledgeShare.count.mockImplementation(orig)
			}
		})
	})
})

// =========================================================
// create, update, deleteById, getAllArchived, getSummary
// =========================================================
describe("KnowledgeService — create", () => {
	it("sets version = parent.version + 1 when parentId provided and no existing versions", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getAllVersionsById.mockResolvedValue([])
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "parent-1", version: 2 })
		(jest.requireMock("$repositories/KnowledgeRepository") as any).create.mockResolvedValue({ id: "child-1" })
		const result = await create("user-1", "tenant-1", { parentId: "parent-1" } as any)
		expect(result.status).toBe(true)
		expect((jest.requireMock("$repositories/KnowledgeRepository") as any).create.mock.calls[0][0]).toMatchObject({ version: 3 })
	})

	it("sets version = highestVersion + 1 when parentId provided and versions exist", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getAllVersionsById.mockResolvedValue([
			{ version: 1 }, { version: 2 }, { version: 3 },
		])
		(jest.requireMock("$repositories/KnowledgeRepository") as any).create.mockResolvedValue({ id: "child-1" })
		const result = await create("user-1", "tenant-1", { parentId: "parent-1" } as any)
		expect(result.status).toBe(true)
		expect((jest.requireMock("$repositories/KnowledgeRepository") as any).create.mock.calls[0][0]).toMatchObject({ version: 4 })
	})

	it("does not set version when parentId not provided", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).create.mockResolvedValue({ id: "k-1" })
		const result = await create("user-1", "tenant-1", { headline: "Test" } as any)
		expect(result.status).toBe(true)
		expect((jest.requireMock("$repositories/KnowledgeRepository") as any).create.mock.calls[0][0]).not.toHaveProperty("version")
	})

	it("logs activity with headline", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).create.mockResolvedValue({ id: "k-1" })
		await create("user-1", "tenant-1", { headline: "My Headline" } as any)
		expect(mockActivityCreate).toHaveBeenCalledWith(
			"user-1", "Menambahkan pengetahuan", "tenant-1",
			'dengan headline "My Headline"',
		)
	})

	it("returns 500 on repo error", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).create.mockRejectedValue(new Error("DB error"))
		const result = await create("user-1", "tenant-1", {} as any)
		expect(result.status).toBe(false)
		expect(result.err?.code).toBe(500)
	})
})

describe("KnowledgeService — getAllArchived", () => {
	it("returns paginated archived knowledge", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getAllArchived.mockResolvedValue({ content: [], totalData: 0 })
		const result = await getAllArchived({ id: "user-1" } as any, "tenant-1", {} as any)
		expect(result.status).toBe(true)
	})

	it("returns 500 on repo error", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getAllArchived.mockRejectedValue(new Error("DB error"))
		const result = await getAllArchived({ id: "user-1" } as any, "tenant-1", {} as any)
		expect(result.status).toBe(false)
	})
})

describe("KnowledgeService — getSummary", () => {
	it("returns summary data from repository", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getSummary.mockResolvedValue({ total: 5, approved: 3 })
		const result = await getSummary({ id: "user-1" } as any, "tenant-1", {} as any)
		expect(result.status).toBe(true)
	})

	it("returns 500 on repo error", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getSummary.mockRejectedValue(new Error("DB error"))
		const result = await getSummary({ id: "user-1" } as any, "tenant-1", {} as any)
		expect(result.status).toBe(false)
	})
})

describe("KnowledgeService — update", () => {
	it("resets status PENDING when current is REJECTED", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "k-1", status: "REJECTED" })
		(jest.requireMock("$repositories/KnowledgeRepository") as any).update.mockResolvedValue({ id: "k-1", status: "PENDING" })
		await update("k-1", "tenant-1", {} as any, "user-1")
		expect((jest.requireMock("$repositories/KnowledgeRepository") as any).update.mock.calls[0][0]).toMatchObject({ status: "PENDING" })
	})

	it("resets status PENDING when current is REVISION", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "k-1", status: "REVISION" })
		(jest.requireMock("$repositories/KnowledgeRepository") as any).update.mockResolvedValue({ id: "k-1", status: "PENDING" })
		await update("k-1", "tenant-1", {} as any, "user-1")
		expect((jest.requireMock("$repositories/KnowledgeRepository") as any).update.mock.calls[0][0]).toMatchObject({ status: "PENDING" })
	})

	it("does not reset status when current is APPROVED", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "k-1", status: "APPROVED" })
		(jest.requireMock("$repositories/KnowledgeRepository") as any).update.mockResolvedValue({ id: "k-1" })
		await update("k-1", "tenant-1", {} as any, "user-1")
		expect((jest.requireMock("$repositories/KnowledgeRepository") as any).update.mock.calls[0][0]).not.toHaveProperty("status")
	})

	it("logs activity with headline", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "k-1" })
		(jest.requireMock("$repositories/KnowledgeRepository") as any).update.mockResolvedValue({ id: "k-1", headline: "Updated" })
		await update("k-1", "tenant-1", { headline: "Updated" } as any, "user-1")
		expect(mockActivityCreate).toHaveBeenCalledWith(
			"user-1", "Mengedit pengetahuan", "tenant-1",
			expect.stringContaining("Updated"),
		)
	})

	it("returns NOT_FOUND when knowledge does not exist", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue(null)
		const result = await update("k-nonexistent", "tenant-1", {} as any, "user-1")
		expect(result.status).toBe(false)
		expect(result.err?.code).toBe(404)
	})

	it("returns 500 on repo error", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockRejectedValue(new Error("DB error"))
		const result = await update("k-1", "tenant-1", {} as any, "user-1")
		expect(result.status).toBe(false)
		expect(result.err?.code).toBe(500)
	})
})

describe("KnowledgeService — deleteById", () => {
	it("returns NOT_FOUND when knowledge does not exist", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue(null)
		const result = await deleteById("k-nonexistent", "tenant-1", "user-1")
		expect(result.status).toBe(false)
		expect(result.err?.code).toBe(404)
	})

	it("deletes knowledge and returns success", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "k-1", headline: "Test" })
		(jest.requireMock("$repositories/KnowledgeRepository") as any).deleteById.mockResolvedValue(undefined)
		(jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mockResolvedValue(undefined)
		const result = await deleteById("k-1", "tenant-1", "user-1")
		expect(result.status).toBe(true)
		expect((jest.requireMock("$repositories/KnowledgeRepository") as any).deleteById).toHaveBeenCalledWith("k-1")
	})

	it("publishes KNOWLEDGE_DELETE pubsub event (fire-and-forget)", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "k-1", headline: "Test" })
		(jest.requireMock("$repositories/KnowledgeRepository") as any).deleteById.mockResolvedValue(undefined)
		(jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mockResolvedValue(undefined)
		await deleteById("k-1", "tenant-1", "user-1")
		expect((jest.requireMock("$pkg/pubsub") as any).default.sendToQueue).toHaveBeenCalledWith(
			"KNOWLEDGE_DELETE",
			{ knowledgeId: "k-1" },
		)
	})

	it("still succeeds when pubsub throws", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "k-1", headline: "Test" })
		(jest.requireMock("$repositories/KnowledgeRepository") as any).deleteById.mockResolvedValue(undefined)
		(jest.requireMock("$pkg/pubsub") as any).default.sendToQueue.mockRejectedValue(new Error("Queue down"))
		const result = await deleteById("k-1", "tenant-1", "user-1")
		expect(result.status).toBe(true)
	})

	it("logs activity before deletion", async () => {
		(jest.requireMock("$repositories/KnowledgeRepository") as any).getById.mockResolvedValue({ id: "k-1", headline: "Delete Me" })
		(jest.requireMock("$repositories/KnowledgeRepository") as any).deleteById.mockResolvedValue(undefined)
		await deleteById("k-1", "tenant-1", "user-1")
		expect(mockActivityCreate).toHaveBeenCalledWith(
			"user-1", "Menghapus pengetahuan", "tenant-1",
			'dengan headline "Delete Me"',
		)
	})
})
