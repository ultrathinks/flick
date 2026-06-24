import { z } from "@hono/zod-openapi";

export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.string().openapi({ example: "BAD_REQUEST" }),
      message: z.string().openapi({ example: "Bad request" }),
    }),
  })
  .openapi("ErrorResponse");

export function jsonContent<T extends z.ZodType>(
  schema: T,
  description: string,
) {
  return {
    content: { "application/json": { schema } },
    description,
  };
}

export function errorResponse(description: string) {
  return jsonContent(errorResponseSchema, description);
}
