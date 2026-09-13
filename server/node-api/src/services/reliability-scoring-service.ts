
/**
 * Node proxy for the Reliability Scoring FastAPI service.
 * Mirrors the contract at RELIABILITY_API_URL (default http://localhost:5000/reliability):
 *   GET  /health
 *   GET  /suburbs
 *   GET  /summary
 *   GET  /stations
 *   GET  /stations/:id
 *   GET  /top
 *   POST /score
 *   POST /score/batch
 *   POST /sentiment
 */
export default class ReliabilityScoringService {
  private getBaseUrl(): string {
    return (process.env.RELIABILITY_API_URL || "http://localhost:5000/reliability").replace(
      /\/$/,
      ""
    );
  }

  private unreachableMessage(): string {
    const baseUrl = this.getBaseUrl();
    return (
      `Reliability scoring ML service is not reachable at ${baseUrl}. ` +
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
      new Error(error?.message || "Unexpected reliability scoring proxy error"),
      { status: 500 }
    );
  }

  private async parseError(response: {
    status: number;
    json: () => Promise<any>;
  }): Promise<string> {
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") return body.detail;
      if (Array.isArray(body?.detail)) {
        return body.detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ");
      }
      return body?.message || `Reliability ML service error: ${response.status}`;
    } catch {
      return `Reliability ML service error: ${response.status}`;
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

  private buildQuery(params: Record<string, unknown>): string {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      search.set(key, String(value));
    });
    const qs = search.toString();
    return qs ? `?${qs}` : "";
  }

  async getHealth(): Promise<any> {
    return this.proxyGet("/health");
  }

  async getSuburbs(): Promise<any> {
    return this.proxyGet("/suburbs");
  }

  async getSummary(params: { suburb?: string } = {}): Promise<any> {
    return this.proxyGet(`/summary${this.buildQuery(params)}`);
  }

  async getStations(params: {
    suburb?: string;
    sentiment?: string;
    min_score?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<any> {
    return this.proxyGet(`/stations${this.buildQuery(params)}`);
  }

  async getStation(chargerId: string): Promise<any> {
    return this.proxyGet(`/stations/${encodeURIComponent(chargerId)}`);
  }

  async getTop(params: {
    kind?: string;
    suburb?: string;
    limit?: number;
  } = {}): Promise<any> {
    return this.proxyGet(`/top${this.buildQuery(params)}`);
  }

  async score(payload: {
    station_id?: string | number;
    name?: string;
    status: string;
    power_kw: number;
    max_power_kw?: number;
  }): Promise<any> {
    return this.proxyPost("/score", payload);
  }

  async scoreBatch(payload: {
    records: Array<{
      station_id?: string | number;
      name?: string;
      status: string;
      power_kw: number;
    }>;
    max_power_kw?: number;
  }): Promise<any> {
    return this.proxyPost("/score/batch", payload);
  }

  async analyzeSentiment(payload: { text: string }): Promise<any> {
    return this.proxyPost("/sentiment", payload);
  }
}
