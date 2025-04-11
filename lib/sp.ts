import z from "zod";
export type SuperpoweredWebAudio = any;

let superpoweredInstance: SuperpoweredWebAudio | undefined;
let superpoweredPromise: Promise<SuperpoweredWebAudio>;

export const SPAnalysisResultSchema = z.object({
  samplerate: z.number(),
  duration: z.number(),
  peakDb: z.number(),
  averageDb: z.number(),
  loudpartsAverageDb: z.number(),
  bpm: z.number(),
  keyIndex: z.number(),
  waveformSize: z.number(),
  peakWaveform: z.instanceof(Uint8Array),
});
export type SPAnalysisResult = z.infer<typeof SPAnalysisResultSchema>;

export async function getSuperpoweredInstance(): Promise<SuperpoweredWebAudio> {
  if (!superpoweredInstance) {
    if (!superpoweredPromise) {
      superpoweredPromise = (async () => {
        const { SuperpoweredGlue } = await import("@/lib/Superpowered");
        const superpowered = await SuperpoweredGlue.Instantiate(
          "ExampleLicenseKey-WillExpire-OnNextUpdate",
          "/js/Superpowered.js"
        );
        return superpowered;
      })();
    }
    superpoweredInstance = await superpoweredPromise;
  }
  return superpoweredInstance;
}

export async function analyseAudio(url: string): Promise<SPAnalysisResult> {
  const TIMEOUT_MS = 30000; // 30 seconds

  const analyserPromise = new Promise<SPAnalysisResult>((resolve, reject) => {
    const analyserWorker = new Worker("/js/analyser.js");

    const cleanup = () => {
      analyserWorker.terminate();
    };

    analyserWorker.onmessage = (e) => {
      try {
        switch (e?.data?.event) {
          case "ready":
            analyserWorker.postMessage({ command: "load", url });
            break;
          case "results":
            const results = SPAnalysisResultSchema.parse(e.data.results);
            resolve(results);
            cleanup();
            break;
          default:
            throw new Error(`Unknown event: ${e.data.event}`);
        }
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    analyserWorker.onerror = (error) => {
      cleanup();
      reject(new Error(`Worker error: ${error.message}`));
    };

    analyserWorker.onmessageerror = () => {
      cleanup();
      reject(new Error("Worker message error"));
    };
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Analysis timed out after 30 seconds"));
    }, TIMEOUT_MS);
  });

  return Promise.race([analyserPromise, timeoutPromise]);
}
