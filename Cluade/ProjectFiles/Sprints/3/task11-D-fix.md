# 🚀 CURSOR PROMPT: Copy AND Insert Variables (Option C)

```markdown
# Fix: Add Both Copy and Insert for Template Variables

## Issue
Copy to clipboard doesn't work on .local domains. Need both insert (direct) and copy (clipboard) options.

## Solution
- Click variable name → inserts at cursor position in textarea
- Click 📋 icon → copies to clipboard (with fallback)
- Visual feedback for both actions

## File: dashboard/src/views/EmailTemplates.vue

### Step 1: Add State for Visual Feedback

**In the `<script setup>` section, add this ref with the other state declarations:**

```javascript
const copiedVariable = ref('')
```

### Step 2: Replace copyToClipboard Method

**Find the existing `copyToClipboard` method:**
```javascript
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    // Could add a toast notification here
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
```

**Replace with these two methods:**

```javascript
const copiedVariable = ref('')

const copyToClipboard = async (text) => {
  try {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      showCopySuccess(text)
    } else {
      // Fallback for non-HTTPS environments (.local domains)
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
        showCopySuccess(text)
      } catch (err) {
        console.error('Fallback copy failed:', err)
      }
      
      document.body.removeChild(textArea)
    }
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const insertVariable = (variable) => {
  const textarea = document.querySelector('textarea[rows="12"]')
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = editForm.value.body
  
  // Insert variable at cursor position
  editForm.value.body = text.substring(0, start) + variable + text.substring(end)
  
  // Move cursor after inserted variable
  setTimeout(() => {
    textarea.focus()
    textarea.selectionStart = textarea.selectionEnd = start + variable.length
  }, 0)
  
  showCopySuccess(variable)
}

const showCopySuccess = (text) => {
  copiedVariable.value = text
  setTimeout(() => {
    copiedVariable.value = ''
  }, 2000)
}
```

### Step 3: Update Variable Buttons in Modal

**Find this section in the edit modal (around line 200-210):**
```vue
<!-- Variables Helper -->
<div class="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
  <p class="text-xs font-semibold text-gray-700 mb-2">Quick Copy Variables:</p>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="variable in getRelevantVariables(editingTemplate.template_key)"
      :key="variable"
      type="button"
      @click="copyToClipboard(variable)"
      class="px-2 py-1 text-xs font-mono bg-white border border-gray-300 rounded hover:bg-gray-100"
    >
      {{ variable }}
    </button>
  </div>
</div>
```

**Replace with:**
```vue
<!-- Variables Helper -->
<div class="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
  <p class="text-xs font-semibold text-gray-700 mb-2">
    Quick Insert Variables:
    <span class="font-normal text-gray-600">
      (Click variable to insert, or click 📋 to copy)
    </span>
  </p>
  <div class="flex flex-wrap gap-2">
    <div
      v-for="variable in getRelevantVariables(editingTemplate.template_key)"
      :key="variable"
      class="flex items-center gap-1"
    >
      <!-- Insert Button (main action) -->
      <button
        type="button"
        @click="insertVariable(variable)"
        class="px-2 py-1 text-xs font-mono border rounded transition-all"
        :class="copiedVariable === variable
          ? 'bg-green-100 border-green-500 text-green-800'
          : 'bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400 text-gray-700'"
        title="Click to insert at cursor position"
      >
        <span v-if="copiedVariable === variable" class="mr-1">✓</span>
        {{ variable }}
      </button>
      
      <!-- Copy Button (secondary action) -->
      <button
        type="button"
        @click.stop="copyToClipboard(variable)"
        class="px-1.5 py-1 text-xs rounded transition-colors hover:bg-gray-200"
        :class="copiedVariable === variable
          ? 'text-green-600'
          : 'text-gray-500 hover:text-gray-700'"
        title="Copy to clipboard"
      >
        📋
      </button>
    </div>
  </div>
</div>
```

### Step 4: Update Top Variables Info Box (Optional)

**Find the variables info box at the top of the page (around line 30-60):**
```vue
<p class="text-xs text-blue-700 mt-2">
  Copy and paste these variables into your templates. They will be replaced with real data when emails are sent.
</p>
```

**Update to:**
```vue
<p class="text-xs text-blue-700 mt-2">
  Use these variables in your templates - they will be replaced with real data when emails are sent. 
  In the editor, click a variable to insert it, or click 📋 to copy.
</p>
```

## Testing

### Test 1: Insert Variable at Cursor
1. Open edit modal
2. Click in the body textarea
3. Position cursor in middle of text
4. Click on "{customer_name}" button
5. Variable inserted at cursor position ✓
6. Cursor moves to end of inserted variable ✓
7. Button turns green with checkmark ✓
8. After 2 seconds, button returns to normal ✓

### Test 2: Insert Multiple Variables
1. Click in textarea at start
2. Click "{customer_name}"
3. Variable inserted ✓
4. Type some text
5. Click "{service_name}"
6. Second variable inserted ✓
7. Both variables in correct positions ✓

### Test 3: Copy to Clipboard
1. Open edit modal
2. Click 📋 icon next to "{customer_name}"
3. Icon turns green ✓
4. Variable button also turns green with checkmark ✓
5. Try pasting (Ctrl+V) into another app
6. Variable text is pasted ✓
7. After 2 seconds, colors return to normal ✓

### Test 4: Visual Feedback
1. Click any variable button (to insert)
2. Button turns green immediately ✓
3. Checkmark appears ✓
4. Click 📋 on different variable
5. New variable turns green ✓
6. Previous one returns to normal ✓
7. Only one highlighted at a time ✓

### Test 5: Insert at Different Positions
1. Click at start of textarea
2. Insert variable → goes at start ✓
3. Click at end of textarea
4. Insert variable → goes at end ✓
5. Select some text in textarea
6. Insert variable → replaces selection ✓

### Test 6: Hover States
1. Hover over variable button
2. Blue highlight appears ✓
3. Hover over 📋 icon
4. Gray background appears ✓
5. Clear visual distinction ✓

### Test 7: Different Templates
1. Edit "Booking Confirmation"
2. See 8 relevant variables ✓
3. Edit "Admin New Booking"
4. See 11 relevant variables ✓
5. Each template shows appropriate variables ✓

### Test 8: Keyboard Workflow
1. Open edit modal
2. Tab to body textarea
3. Type some text
4. Click variable button
5. Variable inserted at cursor ✓
6. Continue typing immediately ✓
7. Focus remains in textarea ✓

### Test 9: Copy Fallback (Non-HTTPS)
1. On .local domain
2. Click 📋 to copy
3. Uses fallback method ✓
4. Variable still copied successfully ✓
5. No console errors ✓

### Test 10: Multiple Quick Clicks
1. Quickly click 3 different variables to insert
2. All 3 inserted in order ✓
3. Visual feedback keeps up ✓
4. No race conditions ✓

## Expected Behavior

### Insert Action (Click Variable Name):
- ✅ Inserts variable at cursor position in textarea
- ✅ Moves cursor to end of inserted variable
- ✅ Green highlight with checkmark for 2 seconds
- ✅ Focus remains in textarea for continued typing

### Copy Action (Click 📋 Icon):
- ✅ Copies variable to clipboard
- ✅ Works on .local domains (fallback method)
- ✅ Green highlight on both icon and variable
- ✅ Can paste into any application

### Visual Feedback:
- ✅ Green background = action successful
- ✅ Checkmark (✓) appears on variable button
- ✅ Auto-clears after 2 seconds
- ✅ Only one variable highlighted at a time

## Notes

- Insert is primary action (most common use case)
- Copy is secondary (for pasting elsewhere)
- Fallback copy method works on .local domains
- Visual feedback confirms action succeeded
- Cursor positioning makes continued typing easy
- Hover states clearly distinguish the two actions
- No clipboard API required for insert (always works)
- Copy uses execCommand fallback for non-HTTPS
```

---

## ✅ AFTER APPLYING

Test the workflow:

1. **Open edit modal**
2. **Click a variable button** → should insert at cursor
3. **Click 📋 icon** → should copy to clipboard
4. **Watch for green feedback** → confirms action worked
5. **Try multiple variables** → all should work smoothly

---

## 🎉 TASK 11 COMPLETE!

Once this works:

✅ **Part A:** Backend API (profile, settings, templates)  
✅ **Part B:** My Profile (with email password verification)  
✅ **Part C:** Email Configuration (SMTP settings)  
✅ **Part D:** Email Templates (with copy AND insert)  

**Say:** "Task 11 complete! Copy and insert both working!"

Then we can move to **Task 11.5: Bulk Working Hours** or **Task 12: Dashboard Polish**! 🚀

---

**Apply this prompt and test!** Let me know when it works!