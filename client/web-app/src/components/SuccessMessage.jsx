
import { CheckCircle } from 'lucide-react';

function SuccessMessage({message}) {
    if (!message || message === '') {
        message = 'Something Succeeded'
    }
    // return the success message container
    return (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-700">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">
                {message}
                </span>
                </div>
    );
}

export default SuccessMessage;

