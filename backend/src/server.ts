import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs-extra";
import filesRouter from "./routes/files";

const app = express();
app.use(cors());
app.use(express.json());

const ROOT = path.resolve(__dirname, "..", "..");
const OUTPUT = path.join(ROOT, "output");
const SOURCE = path.join(ROOT, "source_files");
const UPLOADS = path.join(ROOT, "uploads");
const PANNELLUM_DIST = path.join(ROOT, "pannellum_dist"); // expected to contain pannellum.js & pannellum.css

fs.ensureDirSync(OUTPUT);
fs.ensureDirSync(SOURCE);
fs.ensureDirSync(UPLOADS);

// mount router with paths
app.use("/api/files", filesRouter({
  UPLOADS,
  SOURCE,
  OUTPUT,
  PANNELLUM_DIST
}));

// serve generated zips and output packages
app.use("/downloads", express.static(OUTPUT));

// basic health
app.get("/", (_, res) => res.send("VTG backend running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`VTG backend listening on http://localhost:${PORT}`);
});
