import path from "path";
import fs from "fs-extra";
import archiver from "archiver";
import sharp from "sharp";

type Paths = {
  UPLOADS: string;
  SOURCE: string;
  OUTPUT: string;
  PANNELLUM_DIST: string;
};

export function createProcessor(paths: Paths) {
  return new Processor(paths);
}

class Processor {
  paths: Paths;

  constructor(paths: Paths) {
    this.paths = paths;
  }

  // detect panorama by metadata (2:1 aspect ratio)
  async isPanorama(filePath: string): Promise<boolean> {
    try {
      const meta = await sharp(filePath).metadata();
      if (!meta.width || !meta.height) return false;
      return Math.round(meta.width / meta.height) === 2;
    } catch (err) {
      return false;
    }
  }

  // main function
  async processPackage(opts: { files: Express.Multer.File[]; packageId?: string; packageName?: string; }) {
    const { files, packageId, packageName } = opts;

    const pkgId = packageId || `${Date.now()}`;
    const sourcePkg = path.join(this.paths.SOURCE, `${pkgId}_tour_package`);
    const outputPkg = path.join(this.paths.OUTPUT, pkgId);
    const zipPath = path.join(this.paths.OUTPUT, `${pkgId}.zip`);
    const pannellumDist = this.paths.PANNELLUM_DIST;

    await fs.ensureDir(sourcePkg);
    await fs.ensureDir(outputPkg);
    await fs.ensureDir(path.join(sourcePkg, "panoramas"));

    // Move files from uploads to source package
    const items: { originalname: string; filename: string; path: string; isPanorama: boolean }[] = [];

    for (const f of files) {
      const destName = `${Date.now()}-${f.originalname.replace(/\s+/g, "_")}`;
      const destPath = path.join(sourcePkg, destName);
      await fs.move(f.path, destPath, { overwrite: true });
      const pano = await this.isPanorama(destPath);
      items.push({ originalname: f.originalname, filename: destName, path: destPath, isPanorama: pano });
    }

    // Group panoramas into default floor
    const panoramas = items.filter(i => i.isPanorama);
    const otherFiles = items.filter(i => !i.isPanorama);

    // Create panos directory
    const panosDir = path.join(sourcePkg, "panoramas", "floor_1");
    await fs.ensureDir(panosDir);

    // move panorama files into panosDir and rename to friendly names
    const panoramasMeta: any[] = [];
    let idx = 1;
    for (const p of panoramas) {
      const ext = path.extname(p.filename).toLowerCase() || ".jpg";
      const newName = `pano_${idx}${ext}`;
      const newPath = path.join(panosDir, newName);
      await fs.move(p.path, newPath, { overwrite: true });
      panoramasMeta.push({
        id: `pano_${idx}`,
        file: `panoramas/floor_1/${newName}`,
        originalname: p.originalname
      });
      idx++;
    }

    // copy other files as-is to source package assets
    if (otherFiles.length > 0) {
      const assetsDir = path.join(sourcePkg, "assets");
      await fs.ensureDir(assetsDir);
      for (const o of otherFiles) {
        await fs.move(o.path, path.join(assetsDir, o.filename), { overwrite: true });
      }
    }

    // copy Pannellum dist into output package (viewer files)
    const outViewerDir = path.join(outputPkg, "viewer");
    await fs.ensureDir(outViewerDir);
    try {
      await fs.copy(pannellumDist, outViewerDir);
    } catch (err) {
      // It's OK if pannellumDist doesn't exist; the generator will still create index.html that references relative files.
    }

    // generate config (simple)
    const config = {
      organization: { name: packageName || `Tour_${pkgId}` },
      audio: { background: "assets/audio/background.mp3", volume: 0.3 },
      default_scene: panoramasMeta.length > 0 ? panoramasMeta[0].id : "",
      floors: [
        {
          id: "floor_1",
          name: "Floor 1",
          plan_image: null,
          locations: panoramasMeta.map((p, i) => ({
            id: p.id,
            name: `Location ${i + 1}`,
            panorama: p.file,
            initial_view: { yaw: 0, pitch: 0 },
            hotspots: []
          }))
        }
      ],
      generatedAt: new Date().toISOString()
    };

    // copy panoramas and config into output/<pkgId>/tour/
    const tourDir = path.join(outputPkg, "tour");
    await fs.ensureDir(tourDir);
    // copy panoramas (sourcePkg -> tourDir)
    await fs.copy(path.join(sourcePkg, "panoramas"), path.join(tourDir, "panoramas"));

    // copy any assets
    const sourceAssets = path.join(sourcePkg, "assets");
    if (await fs.pathExists(sourceAssets)) {
      await fs.copy(sourceAssets, path.join(tourDir, "assets"));
    }

    // write config.json
    await fs.writeJson(path.join(tourDir, "config.json"), config, { spaces: 2 });

    // generate index.html (pannellum template)
    const html = this.generateIndexHtml(config);
    await fs.writeFile(path.join(tourDir, "index.html"), html, "utf8");

    // create zip of tourDir
    await this.zipDirectory(tourDir, zipPath);

    // also write a meta file for package
    const metaDir = path.join(this.paths.OUTPUT, pkgId);
    await fs.ensureDir(metaDir);
    await fs.writeJson(path.join(metaDir, "meta.json"), { config, zip: path.basename(zipPath), createdAt: new Date().toISOString() }, { spaces: 2 });

    return {
      success: true,
      packageId: pkgId,
      zipUrl: `/downloads/${path.basename(zipPath)}`,
      config
    };
  }

  generateIndexHtml(config: any) {
    // minimal pannellum template that reads config.json
    const orgName = config.organization?.name || "Virtual Tour";
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${orgName}</title>
<link rel="stylesheet" href="./pannellum.css" />
<style>html,body,#panorama{height:100%;width:100%;margin:0;padding:0}body{font-family:sans-serif}</style>
</head>
<body>
<div id="panorama"></div>
<script src="./pannellum.js"></script>
<script>
fetch('config.json').then(r=>r.json()).then(cfg=>{
  const scenes = {};
  cfg.floors.forEach(f=>{
    f.locations.forEach(loc=>{
      scenes[loc.id] = {
        type: 'equirectangular',
        panorama: loc.panorama,
        pitch: loc.initial_view?.pitch || 0,
        yaw: loc.initial_view?.yaw || 0,
        hotSpots: (loc.hotspots || []).map(h=>({
          pitch: h.pitch, yaw: h.yaw, type: h.type || 'scene', text: h.label || '', sceneId: h.target || ''
        }))
      };
    });
  });
  pannellum.viewer('panorama', {
    default: { firstScene: cfg.default_scene, autoLoad: true },
    scenes
  });
}).catch(err=>{console.error(err);document.body.innerText='Error loading config.json'});
</script>
</body>
</html>`;
  }

  async zipDirectory(srcDir: string, zipFilePath: string) {
    return new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => resolve());
      archive.on("error", (err) => reject(err));

      archive.pipe(output);
      archive.directory(srcDir, false);
      archive.finalize();
    });
  }
}
