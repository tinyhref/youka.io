import { z } from "zod";

export const ffmpegTransitionTypeSchema = z.enum([
  "fade",
  "circleopen",
  "circleclose",
  "diagonalopen",
  "diagonalclose",
  "smoothleft",
  "smoothright",
  "squares",
  "dissolve",
]);

export const ffmpegTransitionOptionsSchema = z.object({
  type: ffmpegTransitionTypeSchema,
  duration: z.number(),
  offset: z.number(),
});
