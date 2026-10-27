/** @type {import('next').NextConfig} */
const ORT_BIN = './node_modules/onnxruntime-node/bin/napi-v6';

const nextConfig = {
  // The bundled plant classifier is read from disk at runtime by /api/identify, and
  // onnxruntime-node loads its native binding with a dynamic require that isn't traced.
  outputFileTracingIncludes: {
    '/api/identify': ['./model/**/*', `${ORT_BIN}/linux/x64/*`],
  },
  // Vercel runs linux/x64: drop other platforms' ONNX Runtime binaries and GPU providers
  // so the function stays well under the size limit.
  outputFileTracingExcludes: {
    '/api/identify': [
      `${ORT_BIN}/darwin/**`,
      `${ORT_BIN}/win32/**`,
      `${ORT_BIN}/linux/arm64/**`,
      `${ORT_BIN}/linux/x64/libonnxruntime_providers_{cuda,tensorrt}.so`,
    ],
  },
};

export default nextConfig;
