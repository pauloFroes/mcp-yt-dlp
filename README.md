# mcp-yt-dlp

MCP server wrapping [yt-dlp](https://github.com/yt-dlp/yt-dlp) for downloading videos and audio from URLs.

Works with Claude Code, Codex, Claude Desktop, Cursor, VS Code, Windsurf, and any MCP-compatible client.

## Prerequisites

- **Node.js** 18+
- **yt-dlp** installed and in PATH

Install yt-dlp:

```bash
brew install yt-dlp
```

## Installation

### Claude Code

```bash
claude mcp add yt-dlp -- npx -y github:pauloFroes/mcp-yt-dlp
```

### Codex

Add to your `codex.toml`:

```toml
[mcp.yt-dlp]
command = "npx"
args = ["-y", "github:pauloFroes/mcp-yt-dlp"]
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "yt-dlp": {
      "command": "npx",
      "args": ["-y", "github:pauloFroes/mcp-yt-dlp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "yt-dlp": {
      "command": "npx",
      "args": ["-y", "github:pauloFroes/mcp-yt-dlp"]
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "yt-dlp": {
      "command": "npx",
      "args": ["-y", "github:pauloFroes/mcp-yt-dlp"]
    }
  }
}
```

### Windsurf

Add to `~/.windsurf/mcp.json`:

```json
{
  "mcpServers": {
    "yt-dlp": {
      "command": "npx",
      "args": ["-y", "github:pauloFroes/mcp-yt-dlp"]
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `check_dependencies` | Check if yt-dlp is installed and available in PATH |
| `get_video_info` | Get video metadata (title, duration, resolution, fps, thumbnail) |
| `download_video` | Download video from URL to local file (best quality MP4) |
| `download_audio` | Download audio only from URL as MP3 |

## License

MIT
