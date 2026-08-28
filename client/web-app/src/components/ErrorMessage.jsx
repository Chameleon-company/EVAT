
import { AlertCircle } from 'lucide-react';

function ErrorMessage({ error }) {
  const message = typeof error === 'string'
    ? error
    : error?.message ?? 'Something went wrong.';

  return (
    <div
      className="mb-3 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700"
      role="alert"
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <span className="text-sm font-semibold">
        {message}
      </span>
    </div>
  );
}

export default ErrorMessage;
