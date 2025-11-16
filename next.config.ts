import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  // Externalize packages that have problematic test files (for server components)
  serverExternalPackages: ['pino', 'thread-stream'],
  
  // Webpack configuration to ignore test files and other non-production files
  webpack: (config, { isServer }) => {
    // Use IgnorePlugin to ignore test files, benchmarks, and other unnecessary files
    config.plugins = config.plugins || [];
    
    // Ignore test files in node_modules
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.(test|spec)\.(js|ts|mjs)$/,
        contextRegExp: /node_modules/,
      })
    );
    
    // Ignore test directories
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\/test\//,
        contextRegExp: /node_modules/,
      })
    );
    
    // Ignore LICENSE and README files
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /(LICENSE|README\.md)$/,
        contextRegExp: /node_modules/,
      })
    );
    
    // Ignore benchmark files
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /bench(?:mark)?\.js$/,
        contextRegExp: /node_modules/,
      })
    );
    
    // Ignore .zip files and other non-code files
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.(zip|sh)$/,
        contextRegExp: /node_modules/,
      })
    );
    
    return config;
  },
  
  // Add empty turbopack config to silence the warning
  // We'll use --webpack flag to force webpack usage
  turbopack: {},
};

export default nextConfig;
