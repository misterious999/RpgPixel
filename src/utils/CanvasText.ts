/**
 * Helper utility for Canvas 2D text rendering with automatic wrapping and truncation.
 * Prevents text from ever overflowing ("keluar jalur") bounding boxes in mobile canvas games.
 */
export class CanvasText {
  /**
   * Splits text into an array of lines that fit strictly within maxWidth.
   * Handles explicit newlines ('\n') as well as automatic word wrapping.
   */
  public static wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const lines: string[] = [];
    const paragraphs = text.split('\n');

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        lines.push('');
        continue;
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;

          // If a single word itself exceeds maxWidth, force-break it
          while (ctx.measureText(currentLine).width > maxWidth && currentLine.length > 3) {
            let sub = currentLine;
            while (ctx.measureText(sub + '-').width > maxWidth && sub.length > 2) {
              sub = sub.slice(0, -1);
            }
            lines.push(sub + '-');
            currentLine = currentLine.slice(sub.length);
          }
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return lines;
  }

  /**
   * Draws wrapped text line-by-line within maxWidth.
   * If maxLines is reached, the last line is truncated with '...'.
   * Returns the total height rendered.
   */
  public static drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number = 8
  ): number {
    const lines = this.wrapText(ctx, text, maxWidth);
    const renderCount = Math.min(lines.length, maxLines);

    for (let i = 0; i < renderCount; i++) {
      let line = lines[i];
      if (i === maxLines - 1 && lines.length > maxLines) {
        // Last line truncation
        while (ctx.measureText(line + '...').width > maxWidth && line.length > 3) {
          line = line.slice(0, -1);
        }
        line += '...';
      }
      ctx.fillText(line, x, y + i * lineHeight);
    }

    return renderCount * lineHeight;
  }

  /**
   * Truncates a single line of text with '...' so it never exceeds maxWidth.
   */
  public static truncate(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string {
    if (ctx.measureText(text).width <= maxWidth) {
      return text;
    }

    let truncated = text;
    while (truncated.length > 2 && ctx.measureText(truncated + '...').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }

    return truncated.trim() + '...';
  }
}
