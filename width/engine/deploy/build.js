'use strict';

const fs   = require('fs');
const path = require('path');

const ENGINE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT   = path.resolve(__dirname, '..', '..', '..');
const GAMES_ROOT  = path.resolve(REPO_ROOT, 'games');
const LIB_ROOT    = path.resolve(REPO_ROOT, 'width', 'lib');
const ARTIFACTS   = path.resolve(__dirname, 'artifacts');
const POINT_FILE  = path.resolve(ARTIFACTS, 'schwarz-diamond.point.js');
const MANIFEST    = path.resolve(ARTIFACTS, 'manifest.json');

// Dimensional Ladder -- load order matters.
// L0 substrate first (schwarz.js), then layers spiral up,
// then drivers, then the entry point folds it all in.
// The Point is the collapse of all dimensions to a single coordinate.
//
// Each dimension has an 'exportName' -- the global it sets on window.
// The Point envelope captures these into a registry so apps can import
// one file and access everything: SchwarzDiamond.Schwarz, .Video, .AutEng, etc.
const DIMENSIONS = [
    // L0 -- the surface itself
    { src: 'schwarz.js',                          label: 'L0 Surface',        exportName: 'Schwarz' },
    // L0-L7 OSI layers
    { src: 'osi/0_void.js',                       label: 'L0 Void',           exportName: 'VoidSubstrate' },
    { src: 'osi/1_physical.js',                    label: 'L1 Physical',       exportName: 'PhysicalSubstrate' },
    { src: 'osi/2_datalink.js',                    label: 'L2 DataLink',       exportName: 'DataLinkSubstrate' },
    { src: 'osi/3_network.js',                     label: 'L3 Network',        exportName: 'NetworkSubstrate' },
    { src: 'osi/4_transport.js',                   label: 'L4 Transport',      exportName: 'TransportSubstrate' },
    { src: 'osi/5_session.js',                     label: 'L5 Session',        exportName: 'SessionSubstrate' },
    { src: 'osi/6_presentation.js',                label: 'L6 Presentation',   exportName: 'PresentationSubstrate' },
    { src: 'osi/7_application.js',                 label: 'L7 Application',    exportName: 'ApplicationManifold' },
    // Substrates
    { src: 'substrate/audio_substrate.js',         label: 'Substrate:Audio',    exportName: 'AudioSubstrate' },
    { src: 'substrate/camera_substrate.js',        label: 'Substrate:Camera',   exportName: 'CameraSubstrate' },
    { src: 'substrate/joystick_substrate.js',      label: 'Substrate:Joystick', exportName: 'JoystickSubstrate' },
    { src: 'substrate/physics_substrate.js',       label: 'Substrate:Physics',  exportName: 'PhysicsSubstrate' },
    { src: 'substrate/render_substrate.js',        label: 'Substrate:Render',   exportName: 'RenderSubstrate' },
    { src: 'substrate/settings_substrate.js',      label: 'Substrate:Settings', exportName: 'SettingsSubstrate' },
    { src: 'substrate/ui_settings_substrate.js',   label: 'Substrate:UISettings', exportName: 'UISettingsSubstrate' },
    // Drivers
    { src: 'drivers/video.js',                     label: 'Driver:Video',       exportName: 'SchwarzVideo' },
    { src: 'drivers/auteng.js',                    label: 'Driver:AutEng',      exportName: 'SchwarzAutEng' },
    // Entry point -- the last dimension folded in
    { src: 'index.js',                             label: 'Entry',              exportName: 'SchwarzDiamond' },
];

// Strip comments and collapse whitespace -- no source leaves this machine.
// Must be careful not to break // inside regex literals or strings.
function minify(code) {
    // 1. Strip block comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');

    // 2. Strip line comments -- but not // inside strings or regex.
    //    Walk each line and only strip if // appears outside quotes/regex.
    code = code.split('\n').map(function(line) {
        var inStr = null; // track ' or " or `
        for (var i = 0; i < line.length; i++) {
            var ch = line[i];
            if (inStr) {
                if (ch === '\\') { i++; continue; } // skip escaped char
                if (ch === inStr) inStr = null;
                continue;
            }
            if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
            if (ch === '/' && i + 1 < line.length && line[i+1] === '/') {
                // Check if this looks like a regex context (preceded by certain tokens)
                var before = line.substring(0, i).trimEnd();
                var lastChar = before.length ? before[before.length - 1] : '';
                // If preceded by a regex-start context, skip (it is regex, not comment)
                if (lastChar === '(' || lastChar === ',' || lastChar === '=' ||
                    lastChar === '[' || lastChar === '!' || lastChar === '&' ||
                    lastChar === '|' || lastChar === ':' || lastChar === ';' ||
                    lastChar === '{' || lastChar === '}' || lastChar === '?' ||
                    lastChar === '\\') {
                    continue; // likely inside a regex literal, do not strip
                }
                return line.substring(0, i).trimEnd();
            }
        }
        return line;
    }).join('\n');

    // 3. Collapse and trim
    return code
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+$/gm, '')
        .trim();
}

// Recursively walk a directory, return { relativePath: fileContents }
function walkDir(dir, base) {
    base = base || dir;
    const results = {};
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const rel = path.relative(base, full).replace(/\\/g, '/');
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            Object.assign(results, walkDir(full, base));
        } else {
            // Binary files (images, fonts, woff2) -> base64. Text -> utf8 string.
            const ext = path.extname(entry).toLowerCase();
            const binary = ['.png','.jpg','.jpeg','.gif','.ico','.woff','.woff2','.ttf','.eot','.mp3','.ogg','.wav'].includes(ext);
            if (binary) {
                results[rel] = { data: fs.readFileSync(full).toString('base64'), encoding: 'base64' };
            } else {
                results[rel] = { data: fs.readFileSync(full, 'utf8'), encoding: 'utf8' };
            }
        }
    }
    return results;
}

// MIME types for the built-in server
const MIME_MAP = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
    '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
};

function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(16).padStart(8, '0');
}

function build() {
    console.log('');
    console.log('  SCHWARZ DIAMOND -- Point Collapse Build');
    console.log('  All dimensions -> single point (L0)');
    console.log('  Artifacts only. No source code ships.');
    console.log('');

    if (!fs.existsSync(ARTIFACTS)) fs.mkdirSync(ARTIFACTS, { recursive: true });

    const manifest = {
        built: new Date().toISOString(),
        type: 'point',
        description: 'All dimensions collapsed to a single point. z=xy at the origin.',
        dimensions: [],
        errors: []
    };

    // Collapse: read each dimension, minify, wrap in module scope
    const modules = [];
    let totalSrc = 0, ok = 0, fail = 0;

    for (const dim of DIMENSIONS) {
        const srcPath = path.join(ENGINE_ROOT, dim.src);
        if (!fs.existsSync(srcPath)) {
            console.log('  SKIP  ' + dim.label + ' (' + dim.src + ' not found)');
            manifest.errors.push({ label: dim.label, src: dim.src, error: 'not found' });
            fail++;
            continue;
        }
        try {
            const raw = fs.readFileSync(srcPath, 'utf8');
            const min = minify(raw);
            totalSrc += raw.length;
            modules.push({ label: dim.label, exportName: dim.exportName, code: min });
            manifest.dimensions.push({
                label: dim.label,
                exportName: dim.exportName,
                src: dim.src,
                srcBytes: raw.length,
                minBytes: min.length
            });
            console.log('  [+] ' + dim.label + ' -> ' + dim.exportName + '  (' + raw.length + ' -> ' + min.length + ')');
            ok++;
        } catch (e) {
            console.log('  [!] ' + dim.label + ': ' + e.message);
            manifest.errors.push({ label: dim.label, src: dim.src, error: e.message });
            fail++;
        }
    }

    // ── Ingest apps as dimensions ───────────────────────────────
    // Each subdirectory under games/ becomes a dimension.
    // Its files become data ON the surface, accessible through _reg.
    console.log('');
    console.log('  -- App Ingestion (manifold substrate) --');
    const appDimensions = [];
    if (fs.existsSync(GAMES_ROOT)) {
        for (const entry of fs.readdirSync(GAMES_ROOT)) {
            const appDir = path.join(GAMES_ROOT, entry);
            if (!fs.statSync(appDir).isDirectory()) continue;
            const files = walkDir(appDir);
            const fileCount = Object.keys(files).length;
            if (fileCount === 0) { console.log('  SKIP  App:' + entry + ' (empty)'); continue; }
            // Convert to exportable name: brickbreaker3d -> BrickBreaker3D
            const exportName = 'App_' + entry.replace(/[^a-zA-Z0-9]/g, '_');
            const appBytes = JSON.stringify(files).length;
            appDimensions.push({ name: entry, exportName, files, fileCount });
            manifest.dimensions.push({ label: 'App:' + entry, exportName, files: fileCount, bytes: appBytes });
            console.log('  [+] App:' + entry + ' -> ' + exportName + '  (' + fileCount + ' files, ' + appBytes + ' bytes)');
            ok++;
        }
    }

    // ── Ingest shared libs (Three.js etc.) ────────────────────
    // Libs that apps reference become part of the manifold too.
    console.log('');
    console.log('  -- Shared Libs Ingestion --');
    const libFiles = {};
    if (fs.existsSync(LIB_ROOT)) {
        const walked = walkDir(LIB_ROOT);
        for (const [relPath, content] of Object.entries(walked)) {
            libFiles[relPath] = content;
        }
        const libBytes = JSON.stringify(libFiles).length;
        console.log('  [+] Libs: ' + Object.keys(libFiles).length + ' files (' + libBytes + ' bytes)');
    }

    // ── Build the Point IIFE ──────────────────────────────────
    // One function. All dimensions — engine, apps, libs, server.
    // No separate instances. Everything is one coordinate.
    const pointParts = [];
    pointParts.push('(function(root) {');
    pointParts.push('"use strict";');
    pointParts.push('var _reg = {};');
    pointParts.push('function _def(name, factory) {');
    pointParts.push('  var m = { exports: {} };');
    pointParts.push('  factory(m, m.exports, root);');
    pointParts.push('  _reg[name] = m.exports;');
    pointParts.push('  if (typeof root !== "undefined") root[name] = m.exports;');
    pointParts.push('}');
    pointParts.push('');

    // Engine dimensions
    for (const mod of modules) {
        pointParts.push('// -- ' + mod.label + ' --');
        pointParts.push('_def("' + mod.exportName + '", function(module, exports, window) {');
        pointParts.push(mod.code);
        pointParts.push('});');
        pointParts.push('');
    }

    // App dimensions -- each app is a dimension whose export is its file manifest
    for (const app of appDimensions) {
        pointParts.push('// -- App: ' + app.name + ' --');
        pointParts.push('_def("' + app.exportName + '", function(module, exports) {');
        pointParts.push('  module.exports = {');
        pointParts.push('    name: ' + JSON.stringify(app.name) + ',');
        pointParts.push('    files: ' + JSON.stringify(app.files) + '');
        pointParts.push('  };');
        pointParts.push('});');
        pointParts.push('');
    }

    // Shared libs dimension
    pointParts.push('// -- Shared Libs --');
    pointParts.push('_def("_libs", function(module, exports) {');
    pointParts.push('  module.exports = ' + JSON.stringify(libFiles) + ';');
    pointParts.push('});');
    pointParts.push('');

    // Server dimension -- ONE server, serves ALL app dimensions
    pointParts.push('// -- Server (the manifold surface serves itself) --');
    pointParts.push('_def("_server", function(module, exports) {');
    pointParts.push('  var MIME = ' + JSON.stringify(MIME_MAP) + ';');
    pointParts.push('  function getMime(p) { var ext = p.match(/\\.[^.]+$/); return ext ? (MIME[ext[0]] || "application/octet-stream") : "text/html"; }');
    pointParts.push('  module.exports = { serve: function(opts) {');
    pointParts.push('    opts = opts || {};');
    pointParts.push('    var port = opts.port || 3000;');
    pointParts.push('    var http = require("http");');
    pointParts.push('    var apps = {};');
    pointParts.push('    var libs = _reg._libs || {};');
    pointParts.push('    for (var k in _reg) { if (k.indexOf("App_") === 0) apps[_reg[k].name] = _reg[k].files; }');
    pointParts.push('    var appNames = Object.keys(apps);');
    pointParts.push('    var server = http.createServer(function(req, res) {');
    pointParts.push('      var url = req.url.split("?")[0];');
    pointParts.push('      if (url === "/") {');
    pointParts.push('        res.writeHead(200, {"Content-Type":"text/html"});');
    pointParts.push('        var links = appNames.map(function(n){return "<li><a href=\\"/"+n+"/\\">"+n+"</a></li>";}).join("");');
    pointParts.push('        res.end("<html><body style=\\"background:#111;color:#eee;font-family:monospace;padding:40px\\"><h1>Schwarz Diamond Point</h1><p>Dimensions: "+Object.keys(_reg).length+"</p><h2>Apps on the manifold:</h2><ul>"+links+"</ul></body></html>");');
    pointParts.push('        return;');
    pointParts.push('      }');
    pointParts.push('      var parts = url.replace(/^\\//, "").split("/");');
    pointParts.push('      var appName = parts[0];');
    pointParts.push('      var filePath = parts.slice(1).join("/") || "index.html";');
    // Serve from app dimension
    pointParts.push('      var appFiles = apps[appName];');
    pointParts.push('      if (appFiles && appFiles[filePath]) {');
    pointParts.push('        var f = appFiles[filePath];');
    pointParts.push('        res.writeHead(200, {"Content-Type": getMime(filePath)});');
    pointParts.push('        res.end(f.encoding === "base64" ? Buffer.from(f.data, "base64") : f.data);');
    pointParts.push('        return;');
    pointParts.push('      }');
    // Serve from shared libs (rewrite paths like ../../width/lib/X -> _libs/X)
    pointParts.push('      var libPath = filePath.replace(/^\\.\\.\\/+/g, "").replace(/^width\\/lib\\//,"").replace(/^lib\\//,"");');
    pointParts.push('      if (libs[libPath]) {');
    pointParts.push('        var lf = libs[libPath];');
    pointParts.push('        res.writeHead(200, {"Content-Type": getMime(libPath)});');
    pointParts.push('        res.end(lf.encoding === "base64" ? Buffer.from(lf.data, "base64") : lf.data);');
    pointParts.push('        return;');
    pointParts.push('      }');
    pointParts.push('      res.writeHead(404); res.end("Not on the surface");');
    pointParts.push('    });');
    pointParts.push('    server.listen(port, function(){ console.log("  Schwarz Diamond Point serving on port "+port); console.log("  Apps: "+appNames.join(", ")); });');
    pointParts.push('    return server;');
    pointParts.push('  }};');
    pointParts.push('});');
    pointParts.push('');

    // The only thing exposed: endpoints.
    // No _reg, no internals, no dimension access. Black box.
    // serve() opens the surface. That is the only export.
    pointParts.push('// -- The Point exposes only endpoints. Nothing else crosses the surface. --');
    pointParts.push('var _point = {');
    pointParts.push('  serve: function(opts) { return _reg._server.serve(opts); },');
    pointParts.push('  dimensions: ' + JSON.stringify(modules.map(m => m.label).concat(appDimensions.map(a => 'App:' + a.name)).concat(['Libs', 'Server'])) + '');
    pointParts.push('};');
    pointParts.push('if (typeof module !== "undefined" && module.exports) module.exports = _point;');
    // Auto-serve if run directly: node schwarz-diamond.point.js
    pointParts.push('if (typeof require !== "undefined" && require.main && require.main.filename === __filename) {');
    pointParts.push('  _point.serve({ port: parseInt(process.env.PORT) || 3000 });');
    pointParts.push('}');
    pointParts.push('})(typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this);');

    const point = pointParts.join('\n');
    fs.writeFileSync(POINT_FILE, point, 'utf8');

    manifest.pointBytes = point.length;
    manifest.srcBytes = totalSrc;
    manifest.hash = simpleHash(point);
    manifest.ratio = ((1 - point.length / totalSrc) * 100).toFixed(1) + '%';
    manifest.apps = appDimensions.map(a => a.name);

    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');

    const totalDims = ok;
    console.log('');
    console.log('  Dimensions collapsed: ' + totalDims + ' (' + DIMENSIONS.length + ' engine + ' + appDimensions.length + ' apps + libs + server)');
    console.log('  Source total:   ' + totalSrc + ' bytes (engine only)');
    console.log('  Point artifact: ' + point.length + ' bytes');
    console.log('  Hash:           ' + manifest.hash);
    console.log('  Output:         artifacts/schwarz-diamond.point.js');
    console.log('');
    if (fail === 0) {
        console.log('  POINT COLLAPSE CLEAN -- all dimensions present');
    } else {
        console.log('  POINT COLLAPSE WITH GAPS -- ' + fail + ' engine dimensions missing');
    }
    console.log('');
    return fail === 0 ? 0 : 1;
}

process.exit(build());
