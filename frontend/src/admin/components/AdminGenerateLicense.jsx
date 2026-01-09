import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { adminApi, getAuthHeader } from "../utils/adminApi";

const AdminGenerateLicense = () => {
  const [expireDays, setExpireDays] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const generateKey = async () => {
    setLoading(true);
    setError("");
    setLicenseKey("");
    setCopied(false);
    let body= JSON.stringify({
          expireDays: expireDays ? Number(expireDays) : undefined,
        })

    try {
      const res = await adminApi.generateLicence(body);

      const data = res.data

      if (!data) {
        throw new Error(data.message || "Failed to generate key");
      }

      setLicenseKey(data.key);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 space-y-5">
      <h2 className="text-xl font-semibold text-gray-800">
        Generate License Key
      </h2>

      {/* Expiry */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Expiry (Days) – optional
        </label>
        <input
          type="number"
          min="1"
          placeholder="e.g. 365"
          value={expireDays}
          onChange={(e) => setExpireDays(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={generateKey}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate License"}
      </button>

      {/* Error */}
      {error && (
        <p className="text-red-600 text-sm text-center">{error}</p>
      )}

      {/* License Key */}
      {licenseKey && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">
            License Key (copy & send to seller)
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={licenseKey}
              className="flex-1 border rounded px-3 py-2 font-mono text-sm bg-white"
            />

            <button
              onClick={copyToClipboard}
              className="p-2 border rounded hover:bg-gray-100"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>

          {copied && (
            <p className="text-green-600 text-sm mt-2">
              Copied to clipboard
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminGenerateLicense;
