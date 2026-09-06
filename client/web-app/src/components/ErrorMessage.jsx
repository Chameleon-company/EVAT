
import { AlertCircle } from 'lucide-react';

function ErrorMessage({ error }) {
  const message = typeof error === 'string'
    ? error
    : error?.message ?? 'Something went wrong.';

  return (
    <div
      className="validation error"
      role="alert"
    >
      <AlertCircle size={20} aria-hidden="true" />
      <span className="text-xsmall font-bold center">{message}</span>
    </div>
  );
}

export default ErrorMessage;
