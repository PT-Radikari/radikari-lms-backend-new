/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import {
	create,
	getAll,
	getById,
	update,
	deleteById,
} from "$services/MasterKnowledgeCaseService"

const mockCreate = jest.fn<any>()
const mockFindMany = jest.fn<any>()
const mockFindUnique = jest.fn<any>()
const mockUpdate = jest.fn<any>()
const mockDelete = jest.fn<any>()
const mockCount = jest.fn<any>()
const mockSubCategoryFindFirst = jest.fn<any>()

jest.mock("$pkg/prisma", () => ({
	prisma: {
		masterKnowledgeCase: {
			create: (...args: any[]) => mockCreate(...args),
			findMany: (...args: any[]) => mockFindMany(...args),
			findUnique: (...args: any[]) => mockFindUnique(...args),
			update: (...args: any[]) => mockUpdate(...args),
			delete: (...args: any[]) => mockDelete(...args),
			count: (...args: any[]) => mockCount(...args),
		},
		masterKnowledgeSubCategory: {
			findFirst: (...args: any[]) => mockSubCategoryFindFirst(...args),
		},
	},
}))

jest.mock("$repositories/MasterKnowledgeCaseRepository", () => ({
	create: (...args: any[]) => mockCreate(...args),
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

describe("MasterKnowledgeCaseService", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("create", () => {
		it("should create case when parent sub-category belongs to tenant", async () => {
			const mockParentSub = {
				id: "subcat-123",
				name: "JavaScript",
				tenantId: "tenant-123",
			}
			const mockCase = {
				id: "case-123",
				name: "Closures",
				subCategoryId: "subcat-123",
				tenantId: "tenant-123",
			}

			mockSubCategoryFindFirst.mockResolvedValue(mockParentSub)
			mockCreate.mockResolvedValue(mockCase)

			const result = await create("tenant-123", {
				name: "Closures",
				subCategoryId: "subcat-123",
			} as any)

			expect(result.status).toBe(true)
		})

		it("should return error when parent sub-category does not belong to tenant", async () => {
			mockSubCategoryFindFirst.mockResolvedValue(null)

			const result = await create("tenant-123", {
				name: "Closures",
				subCategoryId: "subcat-123",
			} as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(400)
		})

		it("should handle errors and return 500", async () => {
			mockSubCategoryFindFirst.mockRejectedValue(new Error("DB error"))

			const result = await create("tenant-123", {
				name: "Closures",
				subCategoryId: "subcat-123",
			} as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(500)
		})
	})

	describe("getAll", () => {
		it("should return paginated cases for tenant", async () => {
			const mockCases = [
				{
					id: "case-1",
					name: "Closures",
					subCategory: {
						id: "subcat-1",
						name: "JavaScript",
						category: { id: "cat-1", name: "Programming" },
					},
				},
			]
			mockFindMany.mockResolvedValue(mockCases)
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
		it("should return case by id", async () => {
			const mockCase = {
				id: "case-123",
				name: "Closures",
				subCategory: { id: "subcat-123", name: "JavaScript" },
			}
			mockFindUnique.mockResolvedValue(mockCase)

			const result = await getById("case-123")

			expect(result.status).toBe(true)
			expect(result.data).toEqual(mockCase)
		})

		it("should return 404 for non-existent case", async () => {
			mockFindUnique.mockResolvedValue(null)

			const result = await getById("non-existent")

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(404)
		})
	})

	describe("update", () => {
		it("should update case successfully", async () => {
			const mockCase = { id: "case-123", name: "Old Name" }
			const mockUpdated = { id: "case-123", name: "New Name" }
			mockFindUnique.mockResolvedValue(mockCase)
			mockUpdate.mockResolvedValue(mockUpdated)

			const result = await update("case-123", { name: "New Name" } as any)

			expect(result.status).toBe(true)
			expect(result.data).toEqual(mockUpdated)
		})

		it("should return 404 for non-existent case", async () => {
			mockFindUnique.mockResolvedValue(null)

			const result = await update("non-existent", { name: "New" } as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(404)
		})
	})

	describe("deleteById", () => {
		it("should delete case successfully", async () => {
			const mockCase = { id: "case-123", name: "Closures" }
			mockFindUnique.mockResolvedValue(mockCase)
			mockDelete.mockResolvedValue(mockCase)

			const result = await deleteById("case-123")

			expect(result.status).toBe(true)
			expect(mockDelete).toHaveBeenCalled()
		})

		it("should return 404 for non-existent case", async () => {
			mockFindUnique.mockResolvedValue(null)

			const result = await deleteById("non-existent")

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(404)
		})
	})
})
