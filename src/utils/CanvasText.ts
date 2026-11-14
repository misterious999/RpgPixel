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
    const safeMaxWidth = Math.max(16, isNaN(maxWidth) ? 100 : maxWidth);
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

        if (testWidth > safeMaxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;

          // If a single word itself exceeds maxWidth, force-break it with safety guard
          let guardOuter = 0;
          while (ctx.measureText(currentLine).width > safeMaxWidth && currentLine.length > 3 && ++guardOuter < 30) {
            let sub = currentLine;
            let guardInner = 0;
            while (ctx.measureText(sub + '-').width > safeMaxWidth && sub.length > 2 && ++guardInner < 30) {
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
    const safeMaxWidth = Math.max(16, isNaN(maxWidth) ? 100 : maxWidth);
    const lines = this.wrapText(ctx, text, safeMaxWidth);
    const renderCount = Math.min(lines.length, maxLines);

    for (let i = 0; i < renderCount; i++) {
      let line = lines[i];
      if (i === maxLines - 1 && lines.length > maxLines) {
        // Last line truncation with safety guard
        let guard = 0;
        while (ctx.measureText(line + '...').width > safeMaxWidth && line.length > 3 && ++guard < 40) {
          line = line.slice(0, -1);
        }
        line += '...';
      }
      ctx.fillText(line, Math.round(x), Math.round(y + i * lineHeight));
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
    const safeMaxWidth = Math.max(16, isNaN(maxWidth) ? 100 : maxWidth);
    if (ctx.measureText(text).width <= safeMaxWidth) {
      return text;
    }

    let truncated = text;
    let guard = 0;
    while (truncated.length > 2 && ctx.measureText(truncated + '...').width > safeMaxWidth && ++guard < 60) {
      truncated = truncated.slice(0, -1);
    }

    return truncated.trim() + '...';
  }
}
