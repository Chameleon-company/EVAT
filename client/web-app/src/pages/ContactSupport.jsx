import NavBar from "../components/NavBar";
import ChatBubble from "../components/ChatBubble";
import SupportRequestForm from "../components/SupportRequestForm";

export default function ContactSupport() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-transparent dark:text-white">
      <NavBar />

      <div
        className="
          pointer-events-none fixed inset-0 -z-0
          bg-gradient-to-br from-slate-50 via-white to-emerald-50/60
          dark:bg-none
        "
      />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <span
            className="
              inline-flex items-center rounded-full border
              border-emerald-200 bg-emerald-50 px-3 py-1
              text-xs font-semibold uppercase tracking-wider text-emerald-700
              dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-400
            "
          >
            Support Centre
          </span>

          <h1
            className="
              mt-4 text-3xl font-bold tracking-tight
              text-slate-900 sm:text-4xl
              dark:text-white
            "
          >
            How can we help?
          </h1>

          <p
            className="
              mx-auto mt-3 max-w-xl text-sm leading-6
              text-slate-500 sm:text-base
              dark:text-gray-400
            "
          >
            Get in touch with our support team or submit a request and we’ll
            help you with your EVAT experience.
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            className="
              group rounded-2xl border p-6 text-center
              border-slate-200 bg-white
              shadow-[0_6px_25px_rgba(15,23,42,0.06)]
              transition-all duration-300
              hover:-translate-y-1 hover:border-emerald-200
              hover:shadow-[0_12px_30px_rgba(16,185,129,0.12)]
              dark:border-gray-800 dark:bg-[#050806]
              dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)]
              dark:hover:border-emerald-900
              dark:hover:shadow-[0_12px_35px_rgba(16,185,129,0.08)]
            "
          >
            <div
              className="
                mx-auto flex h-11 w-11 items-center justify-center
                rounded-xl bg-emerald-50 text-lg
                transition-colors duration-200
                group-hover:bg-emerald-100
                dark:bg-emerald-950/60
                dark:group-hover:bg-emerald-900/60
              "
            >
              📞
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
              Call Us
            </h2>

            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-gray-200">
              1-800-XXX-XXXX
            </p>

            <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-gray-400">
              Mon–Fri, 9AM – 6PM (EST)
            </p>
          </div>

          <div
            className="
              group rounded-2xl border p-6 text-center
              border-slate-200 bg-white
              shadow-[0_6px_25px_rgba(15,23,42,0.06)]
              transition-all duration-300
              hover:-translate-y-1 hover:border-emerald-200
              hover:shadow-[0_12px_30px_rgba(16,185,129,0.12)]
              dark:border-gray-800 dark:bg-[#050806]
              dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)]
              dark:hover:border-emerald-900
              dark:hover:shadow-[0_12px_35px_rgba(16,185,129,0.08)]
            "
          >
            <div
              className="
                mx-auto flex h-11 w-11 items-center justify-center
                rounded-xl bg-emerald-50 text-lg
                transition-colors duration-200
                group-hover:bg-emerald-100
                dark:bg-emerald-950/60
                dark:group-hover:bg-emerald-900/60
              "
            >
              ✉️
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
              Email Us
            </h2>

            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-gray-200">
              support@domain.com
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
              tech@domain.com
            </p>
          </div>

          <div
            className="
              group rounded-2xl border p-6 text-center
              border-slate-200 bg-white
              shadow-[0_6px_25px_rgba(15,23,42,0.06)]
              transition-all duration-300
              hover:-translate-y-1 hover:border-emerald-200
              hover:shadow-[0_12px_30px_rgba(16,185,129,0.12)]
              dark:border-gray-800 dark:bg-[#050806]
              dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)]
              dark:hover:border-emerald-900
              dark:hover:shadow-[0_12px_35px_rgba(16,185,129,0.08)]
              sm:col-span-2 lg:col-span-1
            "
          >
            <div
              className="
                mx-auto flex h-11 w-11 items-center justify-center
                rounded-xl bg-emerald-50 text-lg
                transition-colors duration-200
                group-hover:bg-emerald-100
                dark:bg-emerald-950/60
                dark:group-hover:bg-emerald-900/60
              "
            >
              📍
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
              Mailing Address
            </h2>

            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-gray-200">
              123 Green Drive
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
              Clean City, ST 00000
            </p>
          </div>
        </div>

        <div className="mt-4">
          <SupportRequestForm />
        </div>
      </main>

      <ChatBubble />
    </div>
  );
}