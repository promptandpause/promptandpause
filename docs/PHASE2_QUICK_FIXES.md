# Phase 2 Quick Fixes

## Issues Found:
1. ❌ Next.js 15 requires awaiting `params` in API routes
2. ❌ Wrong table name: `email_template_versions` → should be `email_template_version_history`
3. ❌ Customization table doesn't have `is_active` column (not in our schema)
4. ❌ Subject template can be null causing errors

## Fixes Required:

### 1. Fix: emailTemplateService.ts (Lines 61, 100, 147, 296, 368)

**Search for:** `email_template_versions`
**Replace with:** `email_template_version_history`

**Search for:** `.eq('is_active', true)` in customization queries (lines 61, 100, 147, 296)
**Replace with:** `.maybeSingle()` or just remove the `.eq('is_active', true)` filter

### 2. Fix: All API route files with `params.id`

Files to fix:
- `app/api/admin/email-templates/[id]/route.ts`
- `app/api/admin/email-templates/[id]/preview/route.ts`
- `app/api/admin/email-templates/[id]/test/route.ts`
- `app/api/admin/email-templates/[id]/versions/route.ts`

**Change from:**
```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const templateResult = await getTemplate(params.id)
```

**Change to:**
```typescript
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const templateResult = await getTemplate(params.id)
```

### 3. Fix: Handle null subject_template

In `preview/route.ts` line 45-50:

**Change from:**
```typescript
let previewSubject = template.subject_template

Object.entries(sampleData).forEach(([key, value]) => {
  const regex = new RegExp(`{{${key}}}`, 'g')
  previewSubject = previewSubject.replace(regex, String(value))
})
```

**Change to:**
```typescript
let previewSubject = template.subject_template || 'No Subject'

Object.entries(sampleData).forEach(([key, value]) => {
  const regex = new RegExp(`{{${key}}}`, 'g')
  previewSubject = previewSubject?.replace(regex, String(value)) || previewSubject
})
```

---

## Quick Command to Apply Fixes

Run these commands to fix automatically (be careful!):

```powershell
# Backup first
Copy-Item "lib\services\emailTemplateService.ts" "lib\services\emailTemplateService.ts.backup"

# Fix table name
(Get-Content "lib\services\emailTemplateService.ts") -replace 'email_template_versions', 'email_template_version_history' | Set-Content "lib\services\emailTemplateService.ts"

# Remove is_active checks for customizations
(Get-Content "lib\services\emailTemplateService.ts") -replace '\.eq\(''is_active'', true\)\s+\.single\(\)', '.maybeSingle()' | Set-Content "lib\services\emailTemplateService.ts"
```

---

## Manual Fix Guide (Safer)

I'll create individual patch files for each issue next...
