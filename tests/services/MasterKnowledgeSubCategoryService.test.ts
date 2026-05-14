/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import {
	create,
	getAll,
	getById,
	update,
	deleteById,
} from "$services/MasterKnowledgeSubCategoryService"

const mockCreate = jest.fn<any>()
const mockFindMany = jest.fn<any>()
const mockFindUnique = jest.fn<any>()
const mockUpdate = jest.fn<any>()
const mockDelete = jest.fn<any>()
const mockCount = jest.fn<any>()
const mockCategoryFindFirst = jest.fn<any>()

jest.mock("$pkg/prisma", () => ({
	prisma: {
		masterKnowledgeSubCategory: {
			create: (...args: any[]) => mockCreate(...args),
			findMany: (...args: any[]) => mockFindMany(...args),
			findUnique: (...args: any[]) => mockFindUnique(...args),
			update: (...args: any[]) => mockUpdate(...args),
			delete: (...args: any[]) => mockDelete(...args),
			count: (...args: any[]) => mockCount(...args),
		},
		masterKnowledgeCategory: {
			findFirst: (...args: any[]) => mockCategoryFindFirst(...args),
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
	buildFilterQuery: jest.fn<any>().mockReturnValue({
		where: {},
		orderBy: {},
		take: 10,
		skip: 0,
	}),
}))

describe("MasterKnowledgeSubCategoryService", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("create", () => {
		it("should create sub-category when parent category belongs to tenant", async () => {
			const mockParentCategory = {
				id: "cat-123",
				name: "Technology",
				tenantId: "tenant-123",
			}
			const mockSubCategory = {
				id: "subcat-123",
				name: "Programming",
				categoryId: "cat-123",
				tenantId: "tenant-123",
			}

			mockCategoryFindFirst.mockResolvedValue(mockParentCategory)
			mockCreate.mockResolvedValue(mockSubCategory)

			const result = await create("tenant-123", {
				name: "Programming",
				categoryId: "cat-123",
			} as any)

			expect(result.status).toBe(true)
			expect(mockCreate).toHaveBeenCalled()
		})

		it("should return error when parent category does not belong to tenant", async () => {
			mockCategoryFindFirst.mockResolvedValue(null)

			const result = await create("tenant-123", {
				name: "Programming",
				categoryId: "cat-123",
			} as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(400)
		})

		it("should handle errors and return 500", async () => {
			mockCategoryFindFirst.mockRejectedValue(new Error("DB error"))

			const result = await create("tenant-123", {
				name: "Programming",
				categoryId: "cat-123",
			} as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(500)
		})
	})

	describe("getAll", () => {
		it("should return paginated sub-categories for tenant", async () => {
			const mockSubCategories = [
				{
					id: "subcat-1",
					name: "Programming",
					category: { id: "cat-1", name: "Tech" },
					_count: { cases: 3 },
				},
			]
			mockFindMany.mockResolvedValue(mockSubCategories)
			mockCount.mockResolvedValue(1)

			const result = await getAll("tenant-123", { page: 1, rows: 10 } as any)

			expect(result.status).toBe(true)
		})

		it("should handle errors and return 500", async () => {
			mockFindMany.mockRejectedValue(new Error("DB error"))

			const result = await getAll("tenant-123", {} as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(500)
		})
	})

	describe("getById", () => {
		it("should return sub-category by id", async () => {
			const mockSubCategory = {
				id: "subcat-123",
				name: "Programming",
				category: { id: "cat-123", name: "Tech" },
				_count: { cases: 5 },
			}
			mockFindUnique.mockResolvedValue(mockSubCategory)

			const result = await getById("subcat-123")

			expect(result.status).toBe(true)
			expect(result.data).toEqual(mockSubCategory)
		})

		it("should return 404 for non-existent sub-category", async () => {
			mockFindUnique.mockResolvedValue(null)

			const result = await getById("non-existent")

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(404)
		})
	})

	describe("update", () => {
		it("should update sub-category successfully", async () => {
			const mockSubCategory = { id: "subcat-123", name: "Old Name" }
			const mockUpdated = { id: "subcat-123", name: "New Name" }
			mockFindUnique.mockResolvedValue(mockSubCategory)
			mockUpdate.mockResolvedValue(mockUpdated)

			const result = await update("subcat-123", { name: "New Name" } as any)

			expect(result.status).toBe(true)
			expect(result.data).toEqual(mockUpdated)
		})

		it("should return 404 for non-existent sub-category", async () => {
			mockFindUnique.mockResolvedValue(null)

			const result = await update("non-existent", { name: "New" } as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(404)
		})
	})

	describe("deleteById", () => {
		it("should delete sub-category without cases", async () => {
			const mockSubCategory = {
				id: "subcat-123",
				_count: { cases: 0 },
			}
			mockFindUnique.mockResolvedValue(mockSubCategory)
			mockDelete.mockResolvedValue(mockSubCategory)

			const result = await deleteById("subcat-123")

			expect(result.status).toBe(true)
			expect(mockDelete).toHaveBeenCalled()
		})

		it("should return 404 for non-existent sub-category", async () => {
			mockFindUnique.mockResolvedValue(null)

			const result = await deleteById("non-existent")

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(404)
		})

		it("should prevent deletion of sub-category with cases", async () => {
			const mockSubCategory = {
				id: "subcat-123",
				_count: { cases: 10 },
			}
			mockFindUnique.mockResolvedValue(mockSubCategory)

			const result = await deleteById("subcat-123")

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(400)
			expect(mockDelete).not.toHaveBeenCalled()
		})
	})
})
