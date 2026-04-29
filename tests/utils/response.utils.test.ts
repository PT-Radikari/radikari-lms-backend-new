/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import {
	response_success,
	response_created,
	response_bad_request,
	response_unauthorized,
	response_forbidden,
	response_not_found,
	response_conflict,
	response_unprocessable_entity,
	response_internal_server_error,
	response_handler,
	handleServiceErrorWithResponse,
} from "$utils/response.utils"
import { ServiceResponse } from "$entities/Service"

function createMockContext() {
	const statusSpy = jest.fn()
	const jsonSpy = jest.fn()
	const ctx: any = {
		status: (code: number) => {
			statusSpy(code)
			return ctx
		},
		json: (data: any, status?: number) => {
			jsonSpy(data, status)
			return ctx
		},
	}
	return { ctx, statusSpy, jsonSpy }
}

describe("response.utils", () => {
	describe("response_handler", () => {
		it("should set status and return json response", () => {
			const { ctx, statusSpy, jsonSpy } = createMockContext()

			response_handler(ctx, 200, { id: "123" }, "Success", [])

			expect(statusSpy).toHaveBeenCalledWith(200)
			expect(jsonSpy).toHaveBeenCalledTimes(1)
			const [data] = jsonSpy.mock.calls[0]
			expect(data.content).toEqual({ id: "123" })
			expect(data.message).toBe("Success")
		})

		it("should handle undefined content", () => {
			const { ctx, statusSpy, jsonSpy } = createMockContext()

			response_handler(ctx, 400, undefined, "Bad Request", [])

			expect(statusSpy).toHaveBeenCalledWith(400)
			expect(jsonSpy).toHaveBeenCalledTimes(1)
			const [data] = jsonSpy.mock.calls[0]
			expect(data.content).toBeNull()
			expect(data.message).toBe("Bad Request")
		})
	})

	describe("response_success", () => {
		it("should return 200 with content", () => {
			const { ctx, statusSpy, jsonSpy } = createMockContext()

			response_success(ctx, { name: "John" }, "Fetched successfully")

			expect(statusSpy).toHaveBeenCalledWith(200)
			expect(jsonSpy).toHaveBeenCalled()
		})
	})

	describe("response_created", () => {
		it("should return 201 with content", () => {
			const { ctx, statusSpy } = createMockContext()

			response_created(ctx, { id: "new-123" }, "Resource created")

			expect(statusSpy).toHaveBeenCalledWith(201)
		})
	})

	describe("response_bad_request", () => {
		it("should return 400", () => {
			const { ctx, statusSpy } = createMockContext()

			response_bad_request(ctx, "Invalid input")

			expect(statusSpy).toHaveBeenCalledWith(400)
		})
	})

	describe("response_unauthorized", () => {
		it("should return 401", () => {
			const { ctx, statusSpy } = createMockContext()

			response_unauthorized(ctx, "Not authenticated")

			expect(statusSpy).toHaveBeenCalledWith(401)
		})
	})

	describe("response_forbidden", () => {
		it("should return 403", () => {
			const { ctx, statusSpy } = createMockContext()

			response_forbidden(ctx, "Access denied")

			expect(statusSpy).toHaveBeenCalledWith(403)
		})
	})

	describe("response_not_found", () => {
		it("should return 404", () => {
			const { ctx, statusSpy } = createMockContext()

			response_not_found(ctx, "Resource not found")

			expect(statusSpy).toHaveBeenCalledWith(404)
		})
	})

	describe("response_conflict", () => {
		it("should return 409", () => {
			const { ctx, statusSpy } = createMockContext()

			response_conflict(ctx, "Already exists")

			expect(statusSpy).toHaveBeenCalledWith(409)
		})
	})

	describe("response_unprocessable_entity", () => {
		it("should return 422", () => {
			const { ctx, statusSpy } = createMockContext()

			response_unprocessable_entity(ctx, "Invalid data format")

			expect(statusSpy).toHaveBeenCalledWith(422)
		})
	})

	describe("response_internal_server_error", () => {
		it("should return 500", () => {
			const { ctx, statusSpy } = createMockContext()

			response_internal_server_error(ctx, "Something went wrong")

			expect(statusSpy).toHaveBeenCalledWith(500)
		})
	})

	describe("handleServiceErrorWithResponse", () => {
		it("should return 400 for code 400", () => {
			const { ctx, statusSpy } = createMockContext()
			const serviceResponse: ServiceResponse<any> = {
				status: false,
				err: { message: "Bad input", code: 400 },
			}

			handleServiceErrorWithResponse(ctx, serviceResponse)

			expect(statusSpy).toHaveBeenCalledWith(400)
		})

		it("should return 404 for code 404", () => {
			const { ctx, statusSpy } = createMockContext()
			const serviceResponse: ServiceResponse<any> = {
				status: false,
				err: { message: "Not found", code: 404 },
			}

			handleServiceErrorWithResponse(ctx, serviceResponse)

			expect(statusSpy).toHaveBeenCalledWith(404)
		})

		it("should return 401 for code 401", () => {
			const { ctx, statusSpy } = createMockContext()
			const serviceResponse: ServiceResponse<any> = {
				status: false,
				err: { message: "Unauthorized", code: 401 },
			}

			handleServiceErrorWithResponse(ctx, serviceResponse)

			expect(statusSpy).toHaveBeenCalledWith(401)
		})

		it("should return 500 for unknown code", () => {
			const { ctx, statusSpy } = createMockContext()
			const serviceResponse: ServiceResponse<any> = {
				status: false,
				err: { message: "Unknown error", code: 999 },
			}

			handleServiceErrorWithResponse(ctx, serviceResponse)

			expect(statusSpy).toHaveBeenCalledWith(500)
		})
	})
})
