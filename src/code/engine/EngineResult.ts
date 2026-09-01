export type EngineResult =
  | {
      status: 'success';
      value: unknown;
      executionTimeMs: number;
      logs?: string[];
    }
  | {
      status: 'error';
      error: string;
      executionTimeMs: number;
      logs?: string[];
    };
