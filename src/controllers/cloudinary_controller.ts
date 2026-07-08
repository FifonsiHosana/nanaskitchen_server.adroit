const cloudinary = require("cloudinary").v2;
import { extractPublicId } from "cloudinary-build-url";
import { Request, Response } from "express";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const imageExport = async (
  req: Request & { file?: { buffer: Buffer } },
  res: Response,
) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  cloudinary.uploader
    .upload_stream(
      { resource_type: "auto" },
      (error: Error | null, result: any) => {
        if (error) {
          console.log(error);
          return res
            .status(500)
            .json({ error: "Error uploading to Cloudinary" });
        }
        res.json({ public_id: result.public_id, url: result.secure_url });
      },
    )
    .end(req.file.buffer);
};

export const imageDelete = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res
        .status(400)
        .json({ success: false, message: "URL is required" });
    }

    const public_id = extractPublicId(url);

    const result = await cloudinary.uploader.destroy(public_id, {
      invalidate: true,
    });

    if (result.result !== "ok") {
      return res.status(400).json({
        success: false,
        message: "Cloudinary deletion failed",
        result,
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: (error as Error).message });
  }
};
