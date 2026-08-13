export default function Footer() {
  return (
    <footer className="border-t border-green-100 bg-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
        <p>
          <span className="font-medium text-green-700">GoviHitha</span> — AI-powered crop advisory for Sri Lankan farmers
        </p>
        <p>Powered by Gemini · OpenMeteo · Google ADK</p>
      </div>
    </footer>
  );
}
