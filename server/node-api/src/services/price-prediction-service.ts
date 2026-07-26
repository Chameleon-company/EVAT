import fetch from "node-fetch";

/**
 * Node proxy for the Price Prediction FastAPI service.
 * Mirrors the README contract at PRICE_API_URL (default http://localhost:8001):
 *   GET  /health
 *   GET  /schema
 *   GET  /model/info
 *   POST /predict
 *   POST /predict/batch
 */
export default class PricePredictionService {
  private getBaseUrl(): string {
    return (process.env.PRICE_API_URL || "http://localhost:8001").replace(/\/$/, "");
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
    const response = await fetch(`${this.getBaseUrl()}${path}`);
    if (!response.ok) {
      throw Object.assign(new Error(await this.parseError(response)), {
        status: response.status,
      });
    }
    return response.json();
  }

  private async proxyPost(path: string, body: unknown): Promise<any> {
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
  }

  /** GET {PRICE_API_URL}/health */
  async getHealth(): Promise<any> {
    return this.proxyGet("/health");
  }

  /** GET {PRICE_API_URL}/schema */
  async getSchema(): Promise<any> {
    return this.proxyGet("/schema");
  }

  /** GET {PRICE_API_URL}/model/info */
  async getModelInfo(): Promise<any> {
    return this.proxyGet("/model/info");
  }

  /**
   * POST {PRICE_API_URL}/predict
   * Body matches README: { row_id?, features }
   */
  async predict(payload: {
    features: Record<string, unknown>;
    row_id?: string | number;
  }): Promise<any> {
    return this.proxyPost("/predict", payload);
  }

  /**
   * POST {PRICE_API_URL}/predict/batch
   * Body matches README: { records: [{ row_id?, features }] }
   */
  async predictBatch(payload: {
    records: Array<{ row_id?: string | number; features: Record<string, unknown> }>;
  }): Promise<any> {
    return this.proxyPost("/predict/batch", payload);
  }
}
