/* eslint-disable @typescript-eslint/no-explicit-any */
export function createServiceMock<T = any>(defaultValue?: T) {
	const fn = jest.fn()
	if (defaultValue !== undefined) fn.mockResolvedValue(defaultValue)
	return fn
}

export function createServiceMockSync<T = any>(defaultValue?: T) {
	const fn = jest.fn()
	if (defaultValue !== undefined) fn.mockReturnValue(defaultValue)
	return fn
}
