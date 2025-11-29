import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { createProcessor } from "../services/processor";

interface EnvPaths {
  UPLOADS: string;
  SOURCE: string;
  OUTPUT: string;
  PANNELLUM_DIST: string;
}

export default function filesRouter(paths: EnvPaths) {
  const router = Router();
  const upload = multer({ dest: paths.UPLOADS });

  const processor = createProcessor(paths);

  // POST upload and process package
  router.post("/process-package", upload.array("files", 200), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[] || [];
      const packageId = (req.body.packageId || "").trim();
      const packageName = (req.body.packageName || "").trim();

      const result = await processor.processPackage({
        files,
        packageId: packageId || undefined,
        packageName: packageName || undefined
      });

      res.json(result);
    } catch (err: any) {
      console.error("processing error:", err);
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });

  // list packages (debug)
  router.get("/packages", async (_, res) => {
    const list: any[] = [];
    const entries = await fs.readdir(paths.OUTPUT);
    for (const e of entries) {
      const stat = await fs.stat(path.join(paths.OUTPUT, e));
      if (stat.isDirectory()) list.push(e);
    }
    res.json({ success: true, packages: list });
  });

  return router;
}
