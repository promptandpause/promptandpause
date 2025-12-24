# How to Get Your xAI API Key

## Quick Steps

1. **Visit xAI Console**
   - Go to: https://console.x.ai/

2. **Create Account / Sign In**
   - Sign up for a new account or log in with existing credentials
   - You may be able to use your X/Twitter account

3. **Generate API Key**
   - Navigate to API Keys section
   - Click "Create New API Key"
   - Copy the generated key (you won't be able to see it again!)

4. **Add to Environment File**
   - Open `.env.local` in your project root
   - Find the line: `XAI_API_KEY=your_xai_key_here`
   - Replace `your_xai_key_here` with your actual key
   - Save the file

## Example

Your `.env.local` should look like this:

```bash
# Primary AI provider: xAI (Grok) (https://console.x.ai/)
XAI_API_KEY=xai-abc123def456ghi789...  # Your actual key here

# Backup AI provider: OpenAI
OPENAI_API_KEY=sk-proj-...  # Keep your existing OpenAI key
```

## What Happens Without It?

If `XAI_API_KEY` is not set:
- ⚠️ The app will automatically fall back to OpenAI (GPT-4o-mini)
- ✅ Daily prompts will still work
- ✅ Weekly insights will still work
- 📊 You'll see warnings in the console logs

## Cost & Limits

- **xAI Pricing**: Check latest pricing at https://x.ai/api
- **Fallback**: OpenAI will be used if xAI fails
- **Monitoring**: Check your usage in the xAI console

## Testing Your Setup

After adding your key:

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Try generating a daily prompt or weekly insight

3. Check the console logs for:
   ```
   ✓ Successfully generated prompt with xAI
   ```

## Troubleshooting

### "403 Access Denied" Error
- Check that your API key is correct
- Verify it's added to `.env.local` as `XAI_API_KEY`
- Make sure there are no extra spaces or quotes

### "XAI_API_KEY not configured" Warning
- The key is missing or incorrectly named
- Check spelling: it should be exactly `XAI_API_KEY`
- Restart your development server after adding it

### API Key Not Working
- Verify the key hasn't expired
- Check your xAI console for API status
- Try regenerating a new key

## Support

- **xAI Documentation**: https://docs.x.ai/
- **xAI Console**: https://console.x.ai/
- **Migration Guide**: `docs/implementation/GROQ_TO_XAI_MIGRATION.md`

---

**Note**: Keep your API key secret! Never commit it to version control or share it publicly.
