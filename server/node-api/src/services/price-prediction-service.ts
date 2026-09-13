/** Where `npm run dev:python` serves the combined Python service when PYTHON_API_URL is unset. */
const DEFAULT_PYTHON_API = "http://127.0.0.1:5000";

/**
 * Node proxy for the Price Prediction routes of the combined Python service,
 * mounted at {PYTHON_API_URL}/pricePrediction:
 *   GET  /health
 *   GET  /schema
 *   GET  /model/info
 *   POST /predict
 *   POST /predict/batch
 */
export default class PricePredictionService {
  // Read on every call and fall back to the local default, so an unset variable no
  // longer sends requests to "undefined/pricePrediction".
  private getBaseUrl(): string {
    const root = (process.env.PYTHON_API_URL || DEFAULT_PYTHON_API).replace(/\/+$/, "");
    return `${root}/pricePrediction`;
  }

  private unreachableMessage(): string {
    const baseUrl = this.getBaseUrl();
    return (
      `Price prediction ML service is not reachable at ${baseUrl}. ` +
      `Start it with: npm run dev:python`
    );
  }

  private isUnreachableError(error: any): boolean {
    const code = error?.code || error?.cause?.code;
    const message = String(error?.message || "");
    return (
      code === "ECONNREFUSED" ||
      code === "ENOTFOUND" ||
      code === "ECONNRESET" ||
      code === "ETIMEDOUT" ||
      message.includes("ECONNREFUSED") ||
      message.includes("fetch failed") ||
      /request to .+ failed, reason:\s*$/i.test(message) ||
      /request to .+ failed/i.test(message)
    );
  }

  private wrapProxyError(error: any): Error {
    if (error?.status) return error;
    if (this.isUnreachableError(error)) {
      return Object.assign(new Error(this.unreachableMessage()), { status: 503 });
    }
    return Object.assign(
      new Error(error?.message || "Unexpected price prediction proxy error"),
      { status: 500 }
    );
  }

  private async parseError(response: { status: number; json: () => Promise<any> }): Promise<string> {
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") return body.detail;
      if (Array.isArray(body?.detail)) {
        return body.detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ");
      }
      return body?.message || `Price ML service error: ${response.status}`;
    } catch {
      return `Price ML service error: ${response.status}`;
    }
  }

  private async proxyGet(path: string): Promise<any> {
    try {
      const response = await fetch(`${this.getBaseUrl()}${path}`);
      if (!response.ok) {
        throw Object.assign(new Error(await this.parseError(response)), {
          status: response.status,
        });
      }
      return response.json();
    } catch (error: any) {
      throw this.wrapProxyError(error);
    }
  }

  private async proxyPost(path: string, body: unknown): Promise<any> {
    try {
      const response = await fetch(`${this.getBaseUrl()}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw Object.assign(new Error(await this.parseError(response)), {
          status: response.status,
        });
      }
      return response.json();
    } catch (error: any) {
      throw this.wrapProxyError(error);
    }
  }

  /** GET {PYTHON_API_URL}/pricePrediction/health */
  async getHealth(): Promise<any> {
    return this.proxyGet("/health");
  }

  /** GET {PYTHON_API_URL}/pricePrediction/schema */
  async getSchema(): Promise<any> {
    return this.proxyGet("/schema");
  }

  /** GET {PYTHON_API_URL}/pricePrediction/model/info */
  async getModelInfo(): Promise<any> {
    return this.proxyGet("/model/info");
  }

  /**
   * POST {PYTHON_API_URL}/pricePrediction/predict
   * Body matches README: { row_id?, features }
   */
  async predict(payload: {
    features: Record<string, unknown>;
    row_id?: string | number;
  }): Promise<any> {
    return this.proxyPost("/predict", payload);
  }

  /**
   * POST {PYTHON_API_URL}/pricePrediction/predict/batch
   * Body matches README: { records: [{ row_id?, features }] }
   */
  async predictBatch(payload: {
    records: Array<{ row_id?: string | number; features: Record<string, unknown> }>;
  }): Promise<any> {
    return this.proxyPost("/predict/batch", payload);
  }
}
