/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"

jest.mock("$repositories/ForumRepository", () => {
	const mockCreate = jest.fn<any>()
	const mockGetById = jest.fn<any>()
	const mockUpdate = jest.fn<any>()
	const mockDeleteById = jest.fn<any>()
	const mockLikeOrUnlikeForum = jest.fn<any>()
	const mockCommentForum = jest.fn<any>()
	const mockGetForumCommentById = jest.fn<any>()
	const mockSoftDeleteForumComment = jest.fn<any>()
	const mockDeleteForumComment = jest.fn<any>()
	const mockCountCommentReplies = jest.fn<any>()
	const mockPinOrUnpinForum = jest.fn<any>()
	const mockLikeOrUnlikeForumComment = jest.fn<any>()
	const mockGetUserForumLike = jest.fn<any>()
	const mockGetCountForumComments = jest.fn<any>()
	return {
		create: mockCreate,
		getById: mockGetById,
		update: mockUpdate,
		deleteById: mockDeleteById,
		likeOrUnlikeForum: mockLikeOrUnlikeForum,
		commentForum: mockCommentForum,
		getForumCommentById: mockGetForumCommentById,
		softDeleteForumComment: mockSoftDeleteForumComment,
		deleteForumComment: mockDeleteForumComment,
		countCommentReplies: mockCountCommentReplies,
		pinOrUnpinForum: mockPinOrUnpinForum,
		likeOrUnlikeForumComment: mockLikeOrUnlikeForumComment,
		getUserForumLike: mockGetUserForumLike,
		getCountForumComments: mockGetCountForumComments,
	}
})

jest.mock("$services/UserActivityLogService", () => ({ create: jest.fn<any>() }))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
}))

import {
	create,
	getById,
	update,
	deleteById,
	likeForum,
	commentForum,
	deleteForumComment,
	pinOrUnpinForum,
	likeOrUnlikeForumComment,
} from "$services/ForumService"

describe("ForumService", () => {
	beforeEach(() => { jest.clearAllMocks() })

	describe("create", () => {
		it("should create forum successfully", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			const logMock = jest.requireMock("$services/UserActivityLogService") as any
			const mockForum = { id: "forum-123", title: "Test Forum" }
			mocks.create.mockResolvedValue(mockForum)

			const result = await create(
				{ title: "Test Forum", content: "Content" } as any,
				"tenant-123",
				"user-123",
			)

			expect(result.status).toBe(true)
			expect(mocks.create).toHaveBeenCalled()
			expect(logMock.create).toHaveBeenCalled()
		})
	})

	describe("getById", () => {
		it("should return forum with like status", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			const mockForum = {
				id: "forum-123",
				title: "Test Forum",
				forumPinneds: [],
			}
			mocks.getById.mockResolvedValue(mockForum)
			mocks.getUserForumLike.mockResolvedValue({ id: "like-1" })
			mocks.getCountForumComments.mockResolvedValue(5)

			const result = await getById("forum-123", "tenant-123", "user-123")

			expect(result.status).toBe(true)
			expect(result.data).toHaveProperty("isLiked")
			expect(result.data).toHaveProperty("countComments")
		})

		it("should return error when forum not found", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			mocks.getById.mockResolvedValue(null)

			const result = await getById("nonexistent", "tenant-123", "user-123")

			expect(result.status).toBe(false)
		})
	})

	describe("update", () => {
		it("should update forum successfully", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			const mockForum = {
				id: "forum-123",
				title: "Old Title",
				createdByUserId: "user-123",
			}
			mocks.getById.mockResolvedValue(mockForum)
			mocks.update.mockResolvedValue({ id: "forum-123", title: "New Title" })

			const result = await update(
				"forum-123",
				{ title: "New Title" } as any,
				"tenant-123",
				"user-123",
			)

			expect(result.status).toBe(true)
		})

		it("should return error when unauthorized", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			mocks.getById.mockResolvedValue({
				id: "forum-123",
				createdByUserId: "other-user",
			})

			const result = await update(
				"forum-123",
				{ title: "New Title" } as any,
				"tenant-123",
				"user-123",
			)

			expect(result.status).toBe(false)
		})
	})

	describe("deleteById", () => {
		it("should delete forum successfully", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			mocks.getById.mockResolvedValue({
				id: "forum-123",
				title: "Test Forum",
				createdByUserId: "user-123",
			})
			mocks.deleteById.mockResolvedValue(undefined)

			const result = await deleteById("forum-123", "tenant-123", "user-123")

			expect(result.status).toBe(true)
		})
	})

	describe("likeForum", () => {
		it("should like forum successfully", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			mocks.getById.mockResolvedValue({ id: "forum-123" })
			mocks.likeOrUnlikeForum.mockResolvedValue(undefined)

			const result = await likeForum("forum-123", "tenant-123", "user-123")

			expect(result.status).toBe(true)
			expect(mocks.likeOrUnlikeForum).toHaveBeenCalled()
		})

		it("should return error when forum not found", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			mocks.getById.mockResolvedValue(null)

			const result = await likeForum("nonexistent", "tenant-123", "user-123")

			expect(result.status).toBe(false)
		})
	})

	describe("commentForum", () => {
		it("should add comment successfully", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			mocks.getById.mockResolvedValue({ id: "forum-123" })
			mocks.commentForum.mockResolvedValue({ id: "comment-123" })

			const result = await commentForum(
				"forum-123",
				{ content: "Great post!" } as any,
				"user-123",
				"tenant-123",
			)

			expect(result.status).toBe(true)
		})
	})

	describe("deleteForumComment", () => {
		it("should soft delete comment when it has replies", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			mocks.getForumCommentById.mockResolvedValue({
				id: "comment-123",
				forumId: "forum-123",
			})
			mocks.countCommentReplies.mockResolvedValue(3)
			mocks.softDeleteForumComment.mockResolvedValue(undefined)

			const result = await deleteForumComment(
				"tenant-123",
				"forum-123",
				"comment-123",
				"user-123",
			)

			expect(result.status).toBe(true)
			expect(mocks.softDeleteForumComment).toHaveBeenCalled()
			expect(mocks.deleteForumComment).not.toHaveBeenCalled()
		})

		it("should hard delete comment when it has no replies", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			mocks.getForumCommentById.mockResolvedValue({
				id: "comment-123",
				forumId: "forum-123",
			})
			mocks.countCommentReplies.mockResolvedValue(0)
			mocks.deleteForumComment.mockResolvedValue(undefined)

			const result = await deleteForumComment(
				"tenant-123",
				"forum-123",
				"comment-123",
				"user-123",
			)

			expect(result.status).toBe(true)
			expect(mocks.deleteForumComment).toHaveBeenCalled()
			expect(mocks.softDeleteForumComment).not.toHaveBeenCalled()
		})

		it("should return error when comment not found", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			mocks.getForumCommentById.mockResolvedValue(null)

			const result = await deleteForumComment(
				"tenant-123",
				"forum-123",
				"nonexistent",
				"user-123",
			)

			expect(result.status).toBe(false)
		})

		it("should return error when comment does not belong to forum", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			mocks.getForumCommentById.mockResolvedValue({
				id: "comment-123",
				forumId: "different-forum",
			})

			const result = await deleteForumComment(
				"tenant-123",
				"forum-123",
				"comment-123",
				"user-123",
			)

			expect(result.status).toBe(false)
		})
	})

	describe("pinOrUnpinForum", () => {
		it("should pin/unpin forum successfully", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			mocks.getById.mockResolvedValue({ id: "forum-123" })
			mocks.pinOrUnpinForum.mockResolvedValue(undefined)

			const result = await pinOrUnpinForum("forum-123", "tenant-123", "user-123")

			expect(result.status).toBe(true)
			expect(mocks.pinOrUnpinForum).toHaveBeenCalled()
		})
	})

	describe("likeOrUnlikeForumComment", () => {
		it("should like/unlike comment successfully", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			mocks.getForumCommentById.mockResolvedValue({ id: "comment-123" })
			mocks.likeOrUnlikeForumComment.mockResolvedValue(undefined)

			const result = await likeOrUnlikeForumComment("comment-123", "user-123")

			expect(result.status).toBe(true)
		})

		it("should return error when comment not found", async () => {
			const mocks = jest.requireMock("$repositories/ForumRepository") as any
			mocks.getForumCommentById.mockResolvedValue(null)

			const result = await likeOrUnlikeForumComment("nonexistent", "user-123")

			expect(result.status).toBe(false)
		})
	})
})
