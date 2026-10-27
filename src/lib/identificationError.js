/** An identification failure with a user-facing message and the HTTP status to return. */
export class IdentificationError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'IdentificationError';
    this.status = status;
  }
}
