# AI Advisor Setup Guide

## OpenAI API Key Configuration

The AI Tranche Advisor uses OpenAI's GPT-4 API for intelligent tranche recommendations. To enable this feature, you need to add your OpenAI API key to your environment variables.

### Setup Steps

1. **Get your OpenAI API Key**
   - Visit https://platform.openai.com/api-keys
   - Sign in or create an account
   - Create a new API key

2. **Create/Update your `.env` file**
   - In the root directory of the project, create a `.env` file (if it doesn't exist)
   - Add the following line:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=sk-your-api-key-here
   ```
   - Replace `sk-your-api-key-here` with your actual API key

3. **Restart your development server**
   - Stop your Next.js dev server (Ctrl+C)
   - Run `npm run dev` again
   - The environment variable will be loaded

### Important Notes

- **`NEXT_PUBLIC_` prefix is required**: This prefix tells Next.js to expose the variable to client-side code
- **`.env` file is gitignored**: Your API key will not be committed to the repository
- **Fallback behavior**: If no API key is provided, the system will use a rule-based advisor as a fallback
- **Status indicator**: The UI will show whether GPT-4 is enabled or if the rule-based advisor is being used

### Example `.env` file

```
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### Verification

After setting up, you should see a green status message in the AI Advisor UI:
- ✅ "OpenAI API Key Configured: Using GPT-4 for AI recommendations"

If you see a yellow warning instead, check that:
1. The `.env` file exists in the project root
2. The variable name is exactly `NEXT_PUBLIC_OPENAI_API_KEY`
3. You've restarted the dev server after adding the key

