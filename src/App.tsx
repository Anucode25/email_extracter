import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Globe, Download, Loader2, AlertCircle, Trash2, PlusCircle, FileText, Archive } from "lucide-react";
import JSZip from "jszip";

interface ExtractionResult {
  url: string;
  emails: string[];
  error?: string;
}

export default function App() {
  const [urlInput, setUrlInput] = useState("");
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    const urls = urlInput
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) {
      setError("Please enter at least one URL.");
      return;
    }

    setError(null);
    setIsExtracting(true);
    setResults([]);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract emails. Please try again.");
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const generateCSV = (result: ExtractionResult) => {
    const header = ["Website URL", "Email"];
    const dataRows = result.emails.length > 0 
      ? result.emails.map((email) => [result.url, email])
      : [[result.url, "No emails found"]];
    
    return [header, ...dataRows].map((e) => e.join(",")).join("\n");
  };

  const downloadSingleCSV = (result: ExtractionResult) => {
    const csvContent = "data:text/csv;charset=utf-8," + generateCSV(result);
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const fileName = result.url.replace(/https?:\/\//, "").replace(/[^a-z0-9]/gi, "_") + ".csv";
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAllZip = async () => {
    const zip = new JSZip();
    results.forEach((res) => {
      const fileName = res.url.replace(/https?:\/\//, "").replace(/[^a-z0-9]/gi, "_") + ".csv";
      zip.file(fileName, generateCSV(res));
    });

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "all_colleges_emails.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearResults = () => {
    setResults([]);
    setUrlInput("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6"
          >
            <Mail className="w-4 h-4" />
            <span>Bulk College Email Extractor</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent"
          >
            Extract Emails from Websites
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Paste multiple college website links below to bulk extract all available email addresses.
          </motion.p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8">
          {/* Input Section */}
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-[#111111] border border-white/5 rounded-2xl p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website URLs (One per line)
              </label>
              <button
                onClick={clearResults}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear All
              </button>
            </div>
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://college.edu&#10;https://university.edu"
              className="w-full h-48 bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none font-mono text-sm"
            />
            
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleExtract}
                disabled={isExtracting}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extracting Emails...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    Start Extraction
                  </>
                )}
              </button>

              {results.length > 0 && (
                <button
                  onClick={handleDownloadAllZip}
                  className="bg-white/5 hover:bg-white/10 text-white font-semibold py-4 px-8 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-3"
                >
                  <Archive className="w-5 h-5" />
                  Download All (ZIP)
                </button>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </motion.section>

          {/* Results Section */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    Extraction Results
                    <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                      {results.length} sites processed
                    </span>
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.01] text-gray-400 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-medium border-b border-white/5">Website URL</th>
                        <th className="px-6 py-4 font-medium border-b border-white/5">Emails Found</th>
                        <th className="px-6 py-4 font-medium border-b border-white/5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {results.map((res, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-300 font-mono max-w-xs truncate">
                            {res.url}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {res.emails.length > 0 ? (
                                res.emails.map((email, eIdx) => (
                                  <span
                                    key={eIdx}
                                    className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20"
                                  >
                                    {email}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-600 text-xs italic">No emails found</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => downloadSingleCSV(res)}
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors bg-blue-500/5 px-3 py-1.5 rounded-lg border border-blue-500/10"
                            >
                              <FileText className="w-3 h-3" />
                              Download CSV
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-600 text-sm">
          <p>© 2026 Bulk College Email Extractor. Built with React & Express.</p>
        </footer>
      </div>
    </div>
  );
}
