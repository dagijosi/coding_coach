import type {
  AssistantContext,
  AssistantResponse,
  AssistantStatus,
  CodingCoachAssistant,
} from './CodingCoachAssistant';

export class UnavailableCodingCoachAssistant
  implements CodingCoachAssistant
{
  getStatus(): AssistantStatus {
    return 'unavailable';
  }

  async respond(
    _context: AssistantContext
  ): Promise<AssistantResponse> {
    return {
      status: 'error',
      error:
        'Coding Coach assistant is not available.',
    };
  }
}
