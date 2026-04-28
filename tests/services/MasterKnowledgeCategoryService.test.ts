/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import {
	create,
	getAll,
	getById,
	update,
	deleteById,
} from "$services/MasterKnowledgeCategoryService"

const mockCreate = jest.fn<any>()
const mockFindMany = jest.fn<any>()
const mockFindUnique = jest.fn<any>()
const mockUpdate = jest.fn<any>()
const mockDelete = jest.fn<any>()
const mockCount = jest.fn<any>()

jest.mock("$pkg/prisma", () => ({
	prisma: {
		masterKnowledgeCategory: {
			create: (...args: any[]) => mockCreate(...args),
			findMany: (...args: any[]) => mockFindMany(...args),
			findUnique: (...args: any[]) => mockFindUnique(...args),
			update: (...args: any[]) => mockUpdate(...args),
			delete: (...args: any[]) => mockDelete(...args),
			count: (...args: any[]) => mockCount(...args),
		},
	},
}))

jest.mock("$pkg/logger", () => {
	return {
		__esModule: true,
		default: {
			info: jest.fn(),
			error: jest.fn(),
		},
	}
})

jest.mock("@nodewave/prisma-ezfilter", () => ({
	BuildQueryFilter: jest.fn<any>().mockImplementation(() => ({
		build: jest.fn<any>().mockReturnValue({
			query: {
				where: {},
				orderBy: {},
				take: 10,
				skip: 0,
			},
		}),
	})),
}))

describe("MasterKnowledgeCategoryService", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("create", () => {
		it("should create a category successfully", async () => {
			const mockCategory = {
				id: "cat-123",
				name: "Technology",
				tenantId: "tenant-123",
			}
			mockCreate.mockResolvedValue(mockCategory)

			const result = await create("tenant-123", { name: "Technology" } as any)

			expect(result.status).toBe(true)
			expect(mockCreate).toHaveBeenCalledWith({
				data: {
					name: "Technology",
					tenantId: "tenant-123",
				},
			})
		})

		it("should handle errors and return 500", async () => {
			mockCreate.mockRejectedValue(new Error("DB error"))

			const result = await create("tenant-123", { name: "Tech" } as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(500)
		})
	})

	describe("getAll", () => {
		it("should return paginated categories for tenant", async () => {
			const mockCategories = [
				{ id: "cat-1", name: "Tech", _count: { subCategories: 2 } },
				{ id: "cat-2", name: "Science", _count: { subCategories: 1 } },
			]
			mockFindMany.mockResolvedValue(mockCategories)
			mockCount.mockResolvedValue(2)

			const result = await getAll("tenant-123", { page: 1, rows: 10 } as any)

			expect(result.status).toBe(true)
			expect((result as any).data.entries).toEqual(mockCategories)
		})

		it("should handle errors and return 500", async () => {
			mockFindMany.mockRejectedValue(new Error("DB error"))

			const result = await getAll("tenant-123", {} as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(500)
		})
	})

	describe("getById", () => {
		it("should return category by id", async () => {
			const mockCategory = {
				id: "cat-123",
				name: "Technology",
				_count: { subCategories: 3 },
			}
			mockFindUnique.mockResolvedValue(mockCategory)

			const result = await getById("cat-123")

			expect(result.status).toBe(true)
			expect(result.data).toEqual(mockCategory)
		})

		it("should return 404 for non-existent category", async () => {
			mockFindUnique.mockResolvedValue(null)

			const result = await getById("non-existent")

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(404)
		})

		it("should handle errors and return 500", async () => {
			mockFindUnique.mockRejectedValue(new Error("DB error"))

			const result = await getById("cat-123")

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(500)
		})
	})

	describe("update", () => {
		it("should update category successfully", async () => {
			const mockCategory = { id: "cat-123", name: "Old Name" }
			const mockUpdated = { id: "cat-123", name: "New Name" }
			mockFindUnique.mockResolvedValue(mockCategory)
			mockUpdate.mockResolvedValue(mockUpdated)

			const result = await update("cat-123", { name: "New Name" } as any)

			expect(result.status).toBe(true)
			expect(result.data).toEqual(mockUpdated)
		})

		it("should return 404 for non-existent category", async () => {
			mockFindUnique.mockResolvedValue(null)

			const result = await update("non-existent", { name: "New" } as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(404)
		})

		it("should handle errors and return 500", async () => {
			mockFindUnique.mockRejectedValue(new Error("DB error"))

			const result = await update("cat-123", { name: "New" } as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(500)
		})
	})

	describe("deleteById", () => {
		it("should delete category without sub-categories", async () => {
			const mockCategory = {
				id: "cat-123",
				_count: { subCategories: 0 },
			}
			mockFindUnique.mockResolvedValue(mockCategory)
			mockDelete.mockResolvedValue(mockCategory)

			const result = await deleteById("cat-123")

			expect(result.status).toBe(true)
			expect(mockDelete).toHaveBeenCalled()
		})

		it("should return 404 for non-existent category", async () => {
			mockFindUnique.mockResolvedValue(null)

			const result = await deleteById("non-existent")

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(404)
		})

		it("should prevent deletion of category with sub-categories", async () => {
			const mockCategory = {
				id: "cat-123",
				_count: { subCategories: 5 },
			}
			mockFindUnique.mockResolvedValue(mockCategory)

			const result = await deleteById("cat-123")

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(400)
			expect(mockDelete).not.toHaveBeenCalled()
		})

		it("should handle errors and return 500", async () => {
			mockFindUnique.mockRejectedValue(new Error("DB error"))

			const result = await deleteById("cat-123")

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(500)
		})
	})
})
