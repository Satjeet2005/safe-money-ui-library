export type SubmitErrorKind = 'timeout' | 'network' | 'rejected' | 'invalid_response';

export type SubmitError = Readonly<{
  kind: SubmitErrorKind;
  message: string;
  code?: string;
  retryable: boolean;
}>;

export class SubmitRejection extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'SubmitRejection';
  }
}
