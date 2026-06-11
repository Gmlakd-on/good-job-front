import type { StrokeData } from "./worldInterface";
import { createSavePayload } from "./serializer";

export type SaveStatus = "saved" | "saving" | "error" | "idle";

type SaveStatusCallback = (status: SaveStatus) => void;

const DEBOUNCE_MS = 5000;

export class AutoSave {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private diaryId: string | null = null;
  private onStatusChange: SaveStatusCallback;
  private abortController: AbortController | null = null;

  constructor(onStatusChange: SaveStatusCallback) {
    this.onStatusChange = onStatusChange;
  }

  /** Set the diary ID for saving */
  setDiaryId(id: string) {
    this.diaryId = id;
  }

  /** Schedule a save (debounced) */
  schedule(plainText: string, strokes: StrokeData[]) {
    if (this.timer) clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      this.performSave(plainText, strokes);
    }, DEBOUNCE_MS);
  }

  /** Force immediate save */
  async flush(plainText: string, strokes: StrokeData[]) {
    if (this.timer) clearTimeout(this.timer);
    await this.performSave(plainText, strokes);
  }

  private async performSave(plainText: string, strokes: StrokeData[]) {
    if (!this.diaryId) return;

    // Cancel previous in-flight request
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    this.onStatusChange("saving");

    try {
      const serializedStrokes = createSavePayload(plainText, strokes);

      const res = await fetch(`/api/diaries/${this.diaryId}/autosave`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: plainText,
          editor_state: {
            version: serializedStrokes.version,
            strokes: serializedStrokes.strokes,
          },
        }),
        signal: this.abortController.signal,
      });

      if (!res.ok) throw new Error(`Save failed: ${res.status}`);

      this.onStatusChange("saved");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("[AutoSave] Error:", err);
      this.onStatusChange("error");
    }
  }

  /** Clean up timers */
  destroy() {
    if (this.timer) clearTimeout(this.timer);
    if (this.abortController) this.abortController.abort();
  }
}
