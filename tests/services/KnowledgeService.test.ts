/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest } from "@jest/globals"
import { approveById } from "$services/KnowledgeService"
import {
	KnowledgeActivityLogAction,
	KnowledgeAccess,
} from "$generated/prisma/client"

jest.mock("$repositories/KnowledgeRepository", () => ({
	getById: jest.fn<any>(),
	updateStatus: jest.fn<any>(),
}))

jest.mock("$services/UserActivityLogService", () => ({
	create: jest.fn<any>(),
}))

jest.mock("$services/NotificationService", () => ({
	notifyTenantUsers: jest.fn<any>(),
	notifySpecificUsers: jest.fn<any>(),
}))

jest.mock("$pkg/pubsub", () => {
	const mockSendToQueue = jest.fn<any>()
	return {
		default: { sendToQueue: mockSendToQueue },
		GlobalPubSub: {
			getInstance: () => ({
				getPubSub: () => ({
					sendToQueue: mockSendToQueue,
				}),
			}),
		},
		PUBSUB_TOPICS: {
			KNOWLEDGE_CREATE: "KNOWLEDGE_CREATE",
			KNOWLEDGE_APPROVAL_NOTIFICATION: "KNOWLEDGE_APPROVAL_NOTIFICATION",
		},
	}
})

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warning: jest.fn<any>(),
}))

describe("KnowledgeService RAG Verification", () => {
	const userId = "user-123"
	const tenantId = "tenant-123"

	it("should send Excel/Markdown content to RAG queue on approval", async () => {
		const knowledgeMocks = jest.requireMock("$repositories/KnowledgeRepository") as any
		const pubsubMock = (jest.requireMock("$pkg/pubsub") as any).default
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
					description:
						"| Product | Qty | Revenue |\n|---|---|---|\n| Widget A | 100 | $1000 |",
				},
			],
		}
		knowledgeMocks.getById.mockResolvedValue(mockKnowledgeExcel)
		knowledgeMocks.updateStatus.mockResolvedValue({ ...mockKnowledgeExcel, status: "APPROVED" })
		pubsubMock.sendToQueue.mockResolvedValue(undefined)
		jest.clearAllMocks()

		const result = await approveById(mockKnowledgeExcel.id, tenantId, userId, {
			action: KnowledgeActivityLogAction.APPROVE,
			comment: "Looks good",
		})

		expect(result.status).toBe(true)
		expect(pubsubMock.sendToQueue).toHaveBeenCalled()

		const calls = pubsubMock.sendToQueue.mock.calls
		const createCall = calls.find((call: any[]) => call[0] === "KNOWLEDGE_CREATE")
		expect(createCall).toBeDefined()

		const payload = (createCall as any[])[1]
		expect(payload?.content).toContain("Headline: Q1 Sales Report")
		expect(payload?.content).toContain("| Product | Qty | Revenue |")
		expect(payload?.content).toContain("| Widget A | 100 | $1000 |")
	})

	it("should send Video metadata to RAG queue on approval", async () => {
		const knowledgeMocks = jest.requireMock("$repositories/KnowledgeRepository") as any
		const pubsubMock = (jest.requireMock("$pkg/pubsub") as any).default
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
			knowledgeAttachment: [
				{ attachmentUrl: "https://storage.com/tutorial.mp4" },
			],
			knowledgeContent: [
				{
					title: "Video Description",
					description: "Watch this video to learn how to setup the server.",
				},
			],
		}
		knowledgeMocks.getById.mockResolvedValue(mockKnowledgeVideo)
		knowledgeMocks.updateStatus.mockResolvedValue({ ...mockKnowledgeVideo, status: "APPROVED" })
		pubsubMock.sendToQueue.mockResolvedValue(undefined)
		jest.clearAllMocks()

		const result = await approveById(mockKnowledgeVideo.id, tenantId, userId, {
			action: KnowledgeActivityLogAction.APPROVE,
			comment: "Approved video",
		})

		expect(result.status).toBe(true)

		const calls = pubsubMock.sendToQueue.mock.calls
		const createCall = calls.find((call: any[]) => call[0] === "KNOWLEDGE_CREATE")
		expect(createCall).toBeDefined()

		const payload = (createCall as any[])[1]
		expect(payload?.content).toContain("Headline: Server Setup Tutorial")
		expect(payload?.fileUrls).toContain("https://storage.com/tutorial.mp4")
	})
})
