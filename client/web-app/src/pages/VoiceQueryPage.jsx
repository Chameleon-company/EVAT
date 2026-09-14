import VoiceQuery from "../components/VoiceQuery";
import NavBar from "../components/NavBar";

function VoiceQueryPage() {
  return (
    <div
      className="
        relative min-h-screen overflow-hidden
        bg-slate-50 text-slate-900
        transition-colors duration-300
        dark:bg-transparent dark:text-white
      "
    >
      <NavBar />

      <div
        className="
          pointer-events-none fixed inset-0 -z-0
          bg-gradient-to-br
          from-slate-50 via-white to-emerald-50/60
          dark:bg-none
        "
      />

      <div
        className="
          pointer-events-none fixed
          left-1/2 top-[15%] -z-0
          h-[500px] w-[700px]
          -translate-x-1/2
          rounded-full
          bg-emerald-100/40
          blur-3xl
          dark:bg-emerald-950/20
        "
      />

      <div
        className="
          pointer-events-none fixed
          -bottom-32 -left-32 -z-0
          h-[400px] w-[400px]
          rounded-full
          bg-emerald-100/20
          blur-3xl
          dark:bg-emerald-900/10
        "
      />

      <main
        className="
          relative z-10
          flex min-h-[calc(100vh-70px)]
          items-center justify-center
          px-4 py-8 sm:px-6 sm:py-10
        "
      >
        <div
          className="
            w-full max-w-2xl
            overflow-hidden
            rounded-3xl
            border
            border-slate-200/80
            bg-white/80
            p-6
            shadow-[0_20px_60px_rgba(15,23,42,0.10)]
            backdrop-blur-xl
            transition-all duration-300
            sm:p-8

            dark:border-emerald-900/50
            dark:bg-[#050806]/80
            dark:shadow-[0_20px_60px_rgba(0,0,0,0.55)]
          "
        >
          <div
            className="
              pointer-events-none absolute
              left-8 right-8 top-0
              h-px
              bg-gradient-to-r
              from-transparent
              via-emerald-400/70
              to-transparent
              dark:via-emerald-500/50
            "
          />

          <VoiceQuery />
        </div>
      </main>
    </div>
  );
}

export default VoiceQueryPage;