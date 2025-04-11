import fs from "fs";
import tmp from "tmp-promise";
import { v4 as uuidv4 } from "uuid";
import config from "../config";
import { CACHE_PATH } from "./path";
import {
  CustomerObject,
  Metadata,
  Role,
  StemsResponse,
  SubscriptionObject,
  SubscriptionsObject,
  IAlignmentItemWord,
  ServerJobStatus,
  Alignment2,
  MayIResponse,
  ISongStem,
  SongTitleAndArtists,
} from "@/types";
import * as report from "@/lib/report";
import got, { Got } from "got";
import Debug from "debug";
import type { Clerk } from "@clerk/clerk-js";
import { sortAlignments } from "./utils";
import rollbar from "./rollbar";
import getMAC from "getmac";
const debug = Debug("youka:desktop");

let clerk: Clerk | undefined;

interface OriginalDownloadData {
  original_url: string;
}

export interface CreditsData {
  remaining: number;
  hasCredits: boolean;
  limit: number;
  used?: number;
  resetDays?: number;
}

interface JobRunResponse {
  modelId: string;
  jobId: string;
}

interface JobStatusResponse<T> {
  status: ServerJobStatus;
  output?: T;
  error?: string;
}

interface UploadData {
  upload_url: string;
}

type AlignJobOutput = IAlignmentItemWord[];

interface SplitJobOutput {
  vocalsUrl: string;
  noVocalsUrl: string;
}

interface AlignmentsResponse {
  alignments: Alignment2[];
}

class Client {
  client: Got;
  mac: string | undefined;

  constructor() {
    try {
      this.mac = getMAC();
    } catch (e) {
      rollbar.error("Failed to get MAC", { e });
    }

    this.client = got.extend({
      retry: {
        limit: 5,
      },
      prefixUrl: config.api,
      hooks: {
        beforeRequest: [
          async (options) => {
            if (!clerk) {
              const Clerk = (await import("@clerk/clerk-js")).Clerk;
              clerk = new Clerk(config.clerk);
            }
            if (!clerk.loaded) {
              await clerk.load();
            }
            let tries = 0;
            let token = await clerk.session?.getToken();
            while (!token) {
              token = await clerk.session?.getToken();
              if (token || tries > 10) {
                break;
              }
              tries++;
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            if (token) {
              // debug("token %s", token);
              options.headers["Authorization"] = `Bearer ${token}`;
            }
          },
          async (request) => {
            if (process.env.NODE_ENV !== "production") {
              debug(
                "request",
                request.url?.toString(),
                request.method,
                request.json
              );
            }
          },
        ],
        afterResponse: [
          async (response) => {
            try {
              if (process.env.NODE_ENV !== "production") {
                const json = JSON.parse(response.body as string);
                debug("response", response.url, response.statusCode, json);
              }
            } finally {
              return response;
            }
          },
        ],
        beforeError: [
          (error) => {
            const { response } = error;
            if (response && response.body) {
              try {
                const json = JSON.parse(response.body as string);
                if (json.error) {
                  error.message = json.error;
                  report.error(json.error, {
                    json,
                    rawerror: error,
                    requestUrl: response.requestUrl,
                  });
                }
              } catch {}
            }
            return error;
          },
        ],
      },
    });
  }

  async parseSongTitle(title: string) {
    return this.client
      .get("title", {
        searchParams: { title },
      })
      .json<SongTitleAndArtists>();
  }

  async customer() {
    return this.client.get("customer", {}).json<CustomerObject>();
  }

  async changePlan(
    subscriptionId: string,
    product_id: number,
    variant_id: number
  ) {
    return this.client
      .post(`subscriptions/${subscriptionId}/edit`, {
        json: {
          product_id,
          variant_id,
        },
      })
      .json<SubscriptionObject>();
  }

  async cancelSubscription(subscriptionId: string) {
    return this.client
      .post(`subscriptions/${subscriptionId}/cancel`)
      .json<SubscriptionObject>();
  }

  async resumeSubscription(subscriptionId: string) {
    return this.client
      .post(`subscriptions/${subscriptionId}/resume`)
      .json<SubscriptionObject>();
  }

  async subscriptions(): Promise<SubscriptionsObject> {
    return this.client.get("subscriptions").json<SubscriptionsObject>();
  }

  async subscription(id: string): Promise<SubscriptionObject> {
    return this.client.get(`subscriptions/${id}`).json<SubscriptionObject>();
  }

  async setMetadata(audioId: string, metadata: Metadata): Promise<Metadata> {
    return this.client
      .post(`audio/${audioId}/metadata`, {
        json: metadata,
      })
      .json<Metadata>();
  }

  async role() {
    return this.client.get("role").json<{ role: Role }>();
  }

  async mayi() {
    return this.client
      .get("mayi", {
        searchParams: {
          mac: this.mac,
        },
      })
      .json<MayIResponse>();
  }

  async creditsData() {
    return this.client.get("credits").json<CreditsData>();
  }

  async reportUsage() {
    for (let i = 0; i < 10; i++) {
      try {
        await this.client
          .post("usage", {
            searchParams: {
              mac: this.mac,
            },
          })
          .json<{ quantity: number }>();
        return;
      } catch (e) {
        if (i < 9) {
          report.error("retry report", e as any);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          report.error("report usage failed", e as any);
        }
      }
    }
  }

  async getMetadata(audioId: string): Promise<Metadata | undefined> {
    try {
      const metadata = await this.client
        .get(`audio/${audioId}/metadata`)
        .json<Metadata>();
      return metadata;
    } catch (e) {
      return undefined;
    }
  }

  async downloadOriginal(audioId: string, signal?: AbortSignal) {
    try {
      const data = await this.client
        .get(`audio/${audioId}/original-download`, { signal })
        .json<OriginalDownloadData>();
      const uri = data["original_url"];
      return got(uri).buffer();
    } catch {
      return undefined;
    }
  }

  async stems(audioId: string, modelId?: string) {
    try {
      const stems = await this.client
        .get(`audio/${audioId}/stems`, {
          searchParams: {
            model: modelId,
          },
        })
        .json<StemsResponse>();
      return stems;
    } catch (e) {
      return undefined;
    }
  }

  async alignments(audioId: string) {
    return this.client
      .get(`audio/${audioId}/alignments`)
      .json<AlignmentsResponse>();
  }

  async alignment(audioId: string, modelId?: string) {
    const { alignments } = await this.alignments(audioId);

    if (!alignments?.length) return;

    alignments.forEach((alignment) => {
      if (!alignment.mode) {
        // @ts-ignore
        alignment.mode = "word";
      }
    });

    if (modelId && modelId !== "auto") {
      return alignments.find((a) => a.modelId === modelId);
    }

    return sortAlignments(alignments)[0];
  }

  async updateAlignment(audioId: string, alignment: Alignment2) {
    return this.client.put(`audio/${audioId}/alignments/${alignment.id}`, {
      json: { alignment },
    });
  }

  async align(
    audioId: string,
    lyrics?: string,
    lang?: string,
    force?: boolean,
    modelId?: string,
    signal?: AbortSignal
  ): Promise<Alignment2 | undefined> {
    debug("align", audioId, lyrics, lang, force, modelId);
    if (!force) {
      const alignment2 = await this.alignment(audioId, modelId);
      if (alignment2) return alignment2;
    }

    const { jobId, modelId: selectedModelId } = await this.client
      .post(`audio/${audioId}/align`, {
        json: { modelId, lang, lyrics },
      })
      .json<JobRunResponse>();

    const job = await this.wait<AlignJobOutput>(
      "align",
      audioId,
      selectedModelId,
      jobId,
      10 * 60 * 1000,
      signal
    );
    const alignment = job?.output;
    if (alignment && alignment.length > 0) {
      const alignment2: Alignment2 = {
        id: uuidv4(),
        mode: "word",
        modelId: selectedModelId,
        alignment,
        createdAt: new Date().toISOString(),
      };
      try {
        await this.updateAlignment(audioId, alignment2);
      } catch (e) {
        report.error("Failed to update alignment", { alignment, e });
      }
      return alignment2;
    }
  }

  async convertImage(image: Buffer): Promise<Buffer> {
    const base64Image = image.toString("base64");
    const response = await this.client
      .post(`convert`, {
        json: { image: base64Image },
      })
      .json<{ image: string }>();
    const convertedImage = Buffer.from(response.image, "base64");
    return convertedImage;
  }

  async saveSplitResult(
    modelId: string,
    vocalsUrl: string,
    noVocalsUrl: string
  ): Promise<ISongStem[]> {
    const [instruments, vocals] = await Promise.all([
      got(noVocalsUrl).buffer(),
      got(vocalsUrl).buffer(),
    ]);

    const instrumentsFile = await tmp.tmpName({
      dir: CACHE_PATH,
      postfix: ".m4a",
    });
    const vocalsFile = await tmp.tmpName({ dir: CACHE_PATH, postfix: ".m4a" });

    await fs.promises.writeFile(instrumentsFile, instruments as Buffer);
    await fs.promises.writeFile(vocalsFile, vocals as Buffer);

    return [
      {
        id: uuidv4(),
        type: "instruments",
        modelId,
        filepath: instrumentsFile,
      },
      {
        id: uuidv4(),
        type: "vocals",
        modelId,
        filepath: vocalsFile,
      },
    ];
  }

  async uploadOriginal(audioId: string, audio: Buffer) {
    const uploadData = await this.client
      .get(`audio/${audioId}/original-upload`)
      .json<UploadData>();

    const uploadUrl = uploadData["upload_url"];
    if (uploadUrl) {
      await got.put(uploadUrl, {
        body: audio,
      });
    }
  }

  async split(
    audioId: string,
    audio: Buffer,
    modelId: string,
    signal?: AbortSignal,
    force?: boolean
  ): Promise<ISongStem[]> {
    if (!force) {
      const stems = await this.stems(audioId, modelId);
      if (stems)
        return this.saveSplitResult(
          stems.modelId,
          stems.vocalsUrl,
          stems.noVocalsUrl
        );
    }

    // Upload the original audio only if doesn't exist
    await client.uploadOriginal(audioId, audio);

    const { jobId, modelId: selectedModelId } = await this.client
      .get(`audio/${audioId}/split`, {
        searchParams: { model: modelId },
      })
      .json<JobRunResponse>();

    const job = await this.wait<SplitJobOutput>(
      "split",
      audioId,
      selectedModelId,
      jobId,
      10 * 60 * 1000,
      signal
    );
    if (job && job.status === "COMPLETED" && job.output) {
      const vocalsUrl = job.output.vocalsUrl;
      const noVocalsUrl = job.output.noVocalsUrl;

      if (vocalsUrl && noVocalsUrl) {
        return this.saveSplitResult(selectedModelId, vocalsUrl, noVocalsUrl);
      }
    }

    throw new Error("Failed to split");
  }

  async wait<T>(
    mode: "align" | "split",
    audioId: string,
    modelId: string,
    jobId: string,
    timeout: number,
    signal?: AbortSignal
  ): Promise<JobStatusResponse<T> | null> {
    debug("wait");

    let elapsed = 0;
    const interval = 10000;

    while (elapsed < timeout) {
      signal?.throwIfAborted();

      const job = await this.client
        .get(
          `audio/${audioId}/${mode}/models/${modelId}/jobs/${jobId}/status`,
          { signal }
        )
        .json<JobStatusResponse<T>>();
      debug(modelId, jobId, job);

      if (!job || !job.status) return null;

      switch (job.status) {
        case "IN_QUEUE":
          debug("Waiting in the queue");
          break;
        case "RUNNING":
          debug("Server is processing your request");
          break;
        case "COMPLETED":
          return job;
        case "FAILED":
          report.error("Job failed", { mode, audioId, job, modelId, jobId });
          return null;
        case "TIMED_OUT":
          report.error("Job timeout", { mode, audioId, job, modelId, jobId });
          return null;
        default:
          break;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
      elapsed += interval;
    }

    rollbar.debug("wait timeout", { mode, audioId, modelId, jobId, elapsed });
    return null;
  }
}

const client = new Client();
export default client;
