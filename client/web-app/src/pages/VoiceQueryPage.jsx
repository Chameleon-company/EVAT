import VoiceQuery from "../components/VoiceQuery";
import NavBar from "../components/NavBar";

function VoiceQueryPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="flex min-h-[calc(100vh-70px)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
          <VoiceQuery />
        </div>
      </main>
    </div>
  );
}

export default VoiceQueryPage;