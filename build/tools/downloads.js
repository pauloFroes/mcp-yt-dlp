import { z } from "zod";
import { execCommand, toolResult, toolError, createTempDir, cleanupTempDir } from "../runner.js";
import { join } from "node:path";
async function whichCommand(cmd) {
    try {
        const { stdout } = await execCommand("which", [cmd], { timeout: 5_000 });
        const path = stdout.trim();
        if (!path)
            return { found: false };
        try {
            const { stdout: versionOut } = await execCommand(cmd, ["--version"], { timeout: 5_000 });
            const version = versionOut.trim().split("\n")[0];
            return { found: true, path, version };
        }
        catch {
            return { found: true, path };
        }
    }
    catch {
        return { found: false };
    }
}
export function registerDownloadTools(server) {
    server.registerTool("check_dependencies", {
        title: "Check Dependencies",
        description: "Check if yt-dlp is installed and available in PATH. Returns status, version, and installation instructions if missing.",
        inputSchema: {},
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            openWorldHint: false,
        },
    }, async () => {
        try {
            const info = await whichCommand("yt-dlp");
            return toolResult({
                installed: info.found,
                path: info.path ?? null,
                version: info.version ?? null,
                ...(!info.found
                    ? { installInstructions: "Install yt-dlp:\n  brew install yt-dlp" }
                    : {}),
            });
        }
        catch (error) {
            return toolError(`Failed to check dependencies: ${error.message}`);
        }
    });
    server.registerTool("get_video_info", {
        title: "Get Video Info",
        description: "Get metadata about a video URL: title, duration, resolution, fps, filesize, thumbnail, and description. Uses yt-dlp --dump-json.",
        inputSchema: {
            url: z.string().describe("Video URL (YouTube, Vimeo, or any yt-dlp supported URL)"),
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            openWorldHint: true,
        },
    }, async ({ url }) => {
        try {
            const { stdout } = await execCommand("yt-dlp", ["--dump-json", "--no-download", url], { timeout: 30_000 });
            const info = JSON.parse(stdout);
            return toolResult({
                title: info.title ?? null,
                duration: info.duration ?? null,
                durationFormatted: info.duration_string ?? null,
                resolution: info.resolution ?? null,
                width: info.width ?? null,
                height: info.height ?? null,
                fps: info.fps ?? null,
                filesize: info.filesize ?? info.filesize_approx ?? null,
                thumbnail: info.thumbnail ?? null,
                description: info.description ?? null,
                uploader: info.uploader ?? null,
                uploadDate: info.upload_date ?? null,
                viewCount: info.view_count ?? null,
                url: info.webpage_url ?? url,
            });
        }
        catch (error) {
            return toolError(`Failed to get video info: ${error.message}`);
        }
    });
    server.registerTool("download_video", {
        title: "Download Video",
        description: "Download a video from a URL to a local file. Returns the path to the downloaded file. Uses yt-dlp with best quality mp4 format.",
        inputSchema: {
            url: z.string().describe("Video URL (YouTube, Vimeo, or any yt-dlp supported URL)"),
            output_dir: z
                .string()
                .optional()
                .describe("Output directory (default: system temp dir)"),
            filename: z
                .string()
                .optional()
                .describe("Output filename without extension (default: video title)"),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            openWorldHint: true,
        },
    }, async ({ url, output_dir, filename }) => {
        let tempDir = null;
        try {
            const dir = output_dir ?? (tempDir = await createTempDir());
            const outputTemplate = filename
                ? join(dir, `${filename}.%(ext)s`)
                : join(dir, "%(title)s.%(ext)s");
            const { stdout } = await execCommand("yt-dlp", [
                "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
                "-o", outputTemplate,
                "--no-playlist",
                "--print", "after_move:filepath",
                url,
            ], { timeout: 300_000 });
            const filePath = stdout.trim().split("\n").pop() ?? "";
            return toolResult({
                filePath,
                source: url,
                temporary: !output_dir,
                ...(tempDir ? { note: "File is in a temp directory. Move it before cleanup." } : {}),
            });
        }
        catch (error) {
            if (tempDir)
                await cleanupTempDir(tempDir);
            return toolError(`Failed to download video: ${error.message}`);
        }
    });
    server.registerTool("download_audio", {
        title: "Download Audio",
        description: "Download only the audio from a URL as MP3. Returns the path to the downloaded file. Uses yt-dlp with audio extraction.",
        inputSchema: {
            url: z.string().describe("Video URL (YouTube, Vimeo, or any yt-dlp supported URL)"),
            output_dir: z
                .string()
                .optional()
                .describe("Output directory (default: system temp dir)"),
            filename: z
                .string()
                .optional()
                .describe("Output filename without extension (default: video title)"),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            openWorldHint: true,
        },
    }, async ({ url, output_dir, filename }) => {
        let tempDir = null;
        try {
            const dir = output_dir ?? (tempDir = await createTempDir());
            const outputTemplate = filename
                ? join(dir, `${filename}.%(ext)s`)
                : join(dir, "%(title)s.%(ext)s");
            const { stdout } = await execCommand("yt-dlp", [
                "-f", "bestaudio",
                "--extract-audio",
                "--audio-format", "mp3",
                "--audio-quality", "5",
                "-o", outputTemplate,
                "--no-playlist",
                "--print", "after_move:filepath",
                url,
            ], { timeout: 120_000 });
            const filePath = stdout.trim().split("\n").pop() ?? "";
            return toolResult({
                filePath,
                source: url,
                format: "mp3",
                temporary: !output_dir,
                ...(tempDir ? { note: "File is in a temp directory. Move it before cleanup." } : {}),
            });
        }
        catch (error) {
            if (tempDir)
                await cleanupTempDir(tempDir);
            return toolError(`Failed to download audio: ${error.message}`);
        }
    });
}
