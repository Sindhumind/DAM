
import type { Request, Response, NextFunction } from "express";
import fs from "node:fs/promises";
import { validateFileSignature } from "../utils/fileSignatureValidation";

export async function validateUploadedFiles(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const files =
    (req.files as Express.Multer.File[] | undefined) ?? [];

  try {
    for (const file of files) {
      const valid = await validateFileSignature(
        file.path,
        file.mimetype,
        file.originalname,
      );

      if (!valid) {
        await Promise.all(
          files.map((item) =>
            fs.unlink(item.path).catch(() => undefined),
          ),
        );

        res.status(400).json({
          message: "File contents do not match an allowed file type.",
        });
        return;
      }
    }

    next();
  } catch (error) {
    await Promise.all(
      files.map((file) =>
        fs.unlink(file.path).catch(() => undefined),
      ),
    );

    next(error);
  }
}
