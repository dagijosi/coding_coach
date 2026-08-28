export type EngineResult =
  | {
      status: 'success';
      value: unknown;
      executionTimeMs: number;
    }
  | {
      status: 'error';
      error: string;
      executionTimeMs: number;
    };
